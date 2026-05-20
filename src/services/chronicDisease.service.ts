import path from "path";
import fs from "fs";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import prisma from "../config/database";
import {
  ICreateConditionDTO,
  ICreateHealthLogDTO,
  IHealthLogResponse,
  IHealthAlertResponse,
  IChronicDashboard,
  IHealthPrediction,
} from "../types/chronicDisease.types";

const REPORTS_DIR = path.join(__dirname, "..", "..", "reports");

class ChronicDiseaseService {
  // ─── Dashboard ─────────────────────────────────────────────────────────

  async getDashboard(userId: string): Promise<IChronicDashboard> {
    const conditions = await prisma.patientCondition.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await prisma.dailyHealthLog.findMany({
      where: { userId, logDate: { gte: sevenDaysAgo } },
      orderBy: { logDate: "desc" },
      include: { condition: { select: { id: true, condition: true } }, alerts: true },
    });

    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const [totalLogs, totalAlerts, unreadAlerts, thisWeekLogs] = await Promise.all([
      prisma.dailyHealthLog.count({ where: { userId } }),
      prisma.healthAlert.count({ where: { userId } }),
      prisma.healthAlert.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dailyHealthLog.count({ where: { userId, logDate: { gte: currentWeekStart } } }),
    ]);

    const conditionsWithStats = await Promise.all(
      conditions.map(async (c) => {
        const logCount = await prisma.dailyHealthLog.count({
          where: { userId, conditionId: c.id },
        });
        const lastLog = await prisma.dailyHealthLog.findFirst({
          where: { userId, conditionId: c.id },
          orderBy: { logDate: "desc" },
          select: { logDate: true },
        });
        return {
          id: c.id,
          condition: c.condition,
          severity: c.severity,
          diagnosedAt: c.diagnosedAt?.toISOString() ?? null,
          logCount,
          lastLog: lastLog?.logDate.toISOString() ?? null,
        };
      })
    );

    return {
      conditions: conditionsWithStats,
      recentLogs: recentLogs.map((l) => this.formatLogResponse(l)),
      alerts: unreadAlerts.map((a) => this.formatAlertResponse(a)),
      stats: {
        totalLogs,
        totalAlerts,
        activeConditions: conditions.length,
        thisWeekLogs,
      },
    };
  }

  // ─── Conditions ────────────────────────────────────────────────────────

  async createCondition(userId: string, data: ICreateConditionDTO) {
    const condition = await prisma.patientCondition.create({
      data: {
        userId,
        condition: data.condition,
        diagnosedAt: data.diagnosedAt ? new Date(data.diagnosedAt) : undefined,
        severity: data.severity,
        notes: data.notes,
      },
    });
    return condition;
  }

  async getConditions(userId: string) {
    return prisma.patientCondition.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteCondition(conditionId: string, userId: string) {
    await prisma.patientCondition.deleteMany({
      where: { id: conditionId, userId },
    });
  }

  // ─── Health Logs ───────────────────────────────────────────────────────

  async createLog(userId: string, data: ICreateHealthLogDTO) {
    const log = await prisma.dailyHealthLog.create({
      data: {
        userId,
        conditionId: data.conditionId,
        logDate: data.logDate ? new Date(data.logDate) : new Date(),
        symptoms: data.symptoms || [],
        painLevel: data.painLevel,
        painLocation: data.painLocation || [],
        mobilityIssues: data.mobilityIssues || [],
        fatigueLevel: data.fatigueLevel,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        bloodSugar: data.bloodSugar,
        heartRate: data.heartRate,
        oxygenLevel: data.oxygenLevel,
        weight: data.weight,
        temperature: data.temperature,
        medicationTaken: data.medicationTaken || [],
        notes: data.notes,
      },
    });

    const alerts = this.detectAbnormalReadings(log, userId);
    if (alerts.length > 0) {
      await prisma.healthAlert.createMany({ data: alerts });
    }

    return prisma.dailyHealthLog.findUnique({
      where: { id: log.id },
      include: { condition: { select: { id: true, condition: true } }, alerts: true },
    });
  }

  private detectAbnormalReadings(log: any, userId: string): Array<{
    userId: string;
    logId: string;
    type: string;
    severity: string;
    metric: string;
    value: string;
    threshold: string;
    message: string;
  }> {
    const alerts: Array<{
      userId: string;
      logId: string;
      type: string;
      severity: string;
      metric: string;
      value: string;
      threshold: string;
      message: string;
    }> = [];

    if (log.bloodPressureSystolic != null) {
      if (log.bloodPressureSystolic > 140) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "warning",
          metric: "blood_pressure", value: String(log.bloodPressureSystolic),
          threshold: "> 140 mmHg",
          message: `High systolic blood pressure: ${log.bloodPressureSystolic} mmHg (normal: 90-140)`,
        });
      } else if (log.bloodPressureSystolic < 90) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "critical",
          metric: "blood_pressure", value: String(log.bloodPressureSystolic),
          threshold: "< 90 mmHg",
          message: `Low systolic blood pressure: ${log.bloodPressureSystolic} mmHg (normal: 90-140)`,
        });
      }
    }

    if (log.bloodPressureDiastolic != null) {
      if (log.bloodPressureDiastolic > 90) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "warning",
          metric: "blood_pressure", value: String(log.bloodPressureDiastolic),
          threshold: "> 90 mmHg",
          message: `High diastolic blood pressure: ${log.bloodPressureDiastolic} mmHg (normal: 60-90)`,
        });
      } else if (log.bloodPressureDiastolic < 60) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "critical",
          metric: "blood_pressure", value: String(log.bloodPressureDiastolic),
          threshold: "< 60 mmHg",
          message: `Low diastolic blood pressure: ${log.bloodPressureDiastolic} mmHg (normal: 60-90)`,
        });
      }
    }

    if (log.bloodSugar != null) {
      if (log.bloodSugar > 180) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "warning",
          metric: "blood_sugar", value: String(log.bloodSugar),
          threshold: "> 180 mg/dL",
          message: `High blood sugar: ${log.bloodSugar} mg/dL (normal: 70-180)`,
        });
      } else if (log.bloodSugar < 70) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "critical",
          metric: "blood_sugar", value: String(log.bloodSugar),
          threshold: "< 70 mg/dL",
          message: `Low blood sugar: ${log.bloodSugar} mg/dL (normal: 70-180)`,
        });
      }
    }

    if (log.heartRate != null) {
      if (log.heartRate > 100) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "warning",
          metric: "heart_rate", value: String(log.heartRate),
          threshold: "> 100 bpm",
          message: `High heart rate: ${log.heartRate} bpm (normal: 60-100)`,
        });
      } else if (log.heartRate < 60) {
        alerts.push({
          userId, logId: log.id, type: "abnormal_reading", severity: "warning",
          metric: "heart_rate", value: String(log.heartRate),
          threshold: "< 60 bpm",
          message: `Low heart rate: ${log.heartRate} bpm (normal: 60-100)`,
        });
      }
    }

    if (log.oxygenLevel != null && log.oxygenLevel < 95) {
      alerts.push({
        userId, logId: log.id, type: "abnormal_reading", severity: log.oxygenLevel < 90 ? "critical" : "warning",
        metric: "oxygen_level", value: String(log.oxygenLevel),
        threshold: "< 95%",
        message: `Low oxygen level: ${log.oxygenLevel}% (normal: 95-100)`,
      });
    }

    return alerts;
  }

  async getLogs(
    userId: string,
    filters: { from?: string; to?: string; conditionId?: string; page?: number; limit?: number }
  ) {
    const { from, to, conditionId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (from || to) {
      where.logDate = {};
      if (from) where.logDate.gte = new Date(from);
      if (to) where.logDate.lte = new Date(to);
    }
    if (conditionId) where.conditionId = conditionId;

    const [logs, total] = await Promise.all([
      prisma.dailyHealthLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { logDate: "desc" },
        include: { condition: { select: { id: true, condition: true } }, alerts: true },
      }),
      prisma.dailyHealthLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => this.formatLogResponse(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(logId: string, userId: string) {
    const log = await prisma.dailyHealthLog.findFirst({
      where: { id: logId, userId },
      include: { condition: { select: { id: true, condition: true } }, alerts: true },
    });

    if (!log) return null;
    return this.formatLogResponse(log);
  }

  // ─── Alerts ────────────────────────────────────────────────────────────

  async getAlerts(userId: string) {
    const alerts = await prisma.healthAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return alerts.map((a) => this.formatAlertResponse(a));
  }

  async markAlertRead(alertId: string, userId: string) {
    const alert = await prisma.healthAlert.findFirst({
      where: { id: alertId, userId },
    });
    if (!alert) return null;

    return prisma.healthAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  // ─── Reports ───────────────────────────────────────────────────────────

  async generateReport(userId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const toDateEnd = new Date(to);
    toDateEnd.setHours(23, 59, 59, 999);

    const logs = await prisma.dailyHealthLog.findMany({
      where: { userId, logDate: { gte: fromDate, lte: toDateEnd } },
      orderBy: { logDate: "asc" },
    });

    const totalLogs = logs.length;
    const avgSystolic = this.average(logs.map((l) => l.bloodPressureSystolic));
    const avgDiastolic = this.average(logs.map((l) => l.bloodPressureDiastolic));
    const avgBloodSugar = this.average(logs.map((l) => l.bloodSugar));
    const avgHeartRate = this.average(logs.map((l) => l.heartRate));
    const avgOxygen = this.average(logs.map((l) => l.oxygenLevel));
    const avgWeight = this.average(logs.map((l) => l.weight));
    const avgPain = this.average(logs.map((l) => l.painLevel));
    const avgFatigue = this.average(logs.map((l) => l.fatigueLevel));

    const symptomFrequency: Record<string, number> = {};
    logs.forEach((l) => {
      const symptoms = (l.symptoms as string[]) || [];
      symptoms.forEach((s) => {
        symptomFrequency[s] = (symptomFrequency[s] || 0) + 1;
      });
    });

    const title = `Health Report (${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})`;

    const reportData = {
      totalLogs,
      dateRange: { from, to },
      averages: {
        bloodPressureSystolic: avgSystolic,
        bloodPressureDiastolic: avgDiastolic,
        bloodSugar: avgBloodSugar,
        heartRate: avgHeartRate,
        oxygenLevel: avgOxygen,
        weight: avgWeight,
        painLevel: avgPain,
        fatigueLevel: avgFatigue,
      },
      symptomFrequency,
    };

    // Generate PDF
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const pdfId = crypto.randomUUID();
    const pdfPath = path.join(REPORTS_DIR, `${pdfId}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const brandColor = "#111111";
    const mutedColor = "#666666";
    const lineY = (y: number) => { doc.moveTo(40, y).lineTo(550, y).strokeColor("#e5e7eb").stroke(); };
    let y = 40;

    // Header
    doc.font("Helvetica-Bold").fontSize(22).fillColor(brandColor).text("Health Report", 40, y);
    y += 30;
    doc.font("Helvetica").fontSize(10).fillColor(mutedColor).text(`Period: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`, 40, y);
    y += 16;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
    y += 30;
    lineY(y); y += 20;

    // Summary
    doc.font("Helvetica-Bold").fontSize(14).fillColor(brandColor).text("Summary", 40, y);
    y += 24;
    doc.font("Helvetica").fontSize(11).fillColor("#333333");
    doc.text(`Total Log Entries: ${totalLogs}`, 40, y); y += 18;
    doc.text(`Unique Symptoms Tracked: ${Object.keys(symptomFrequency).length}`, 40, y); y += 18;
    if (totalLogs > 0) {
      const avgPainVal = avgPain != null ? avgPain.toFixed(1) : "N/A";
      doc.text(`Average Pain Level: ${avgPainVal}/10`, 40, y); y += 18;
    }
    y += 10;
    lineY(y); y += 20;

    // Averages
    doc.font("Helvetica-Bold").fontSize(14).fillColor(brandColor).text("Vital Signs Averages", 40, y);
    y += 24;
    doc.font("Helvetica").fontSize(11).fillColor("#333333");
    const vitals = [
      { label: "Systolic BP", value: avgSystolic, unit: "mmHg" },
      { label: "Diastolic BP", value: avgDiastolic, unit: "mmHg" },
      { label: "Blood Sugar", value: avgBloodSugar, unit: "mg/dL" },
      { label: "Heart Rate", value: avgHeartRate, unit: "bpm" },
      { label: "Oxygen Level", value: avgOxygen, unit: "%" },
      { label: "Weight", value: avgWeight, unit: "kg" },
    ];
    const col1X = 40;
    const col2X = 200;
    const col3X = 360;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(mutedColor);
    doc.text("Metric", col1X, y); doc.text("Average", col2X, y); doc.text("Unit", col3X, y);
    y += 18;
    lineY(y); y += 6;
    doc.font("Helvetica").fontSize(11).fillColor("#333333");
    for (const v of vitals) {
      if (v.value != null) {
        doc.text(v.label, col1X, y);
        doc.text(typeof v.value === "number" ? v.value.toFixed(1) : "N/A", col2X, y);
        doc.text(v.unit, col3X, y);
        y += 18;
      }
    }
    y += 10;
    lineY(y); y += 20;

    // Symptoms
    if (Object.keys(symptomFrequency).length > 0) {
      doc.font("Helvetica-Bold").fontSize(14).fillColor(brandColor).text("Symptom Frequency", 40, y);
      y += 24;
      doc.font("Helvetica").fontSize(11).fillColor("#333333");
      const sortedSymptoms = Object.entries(symptomFrequency).sort((a, b) => b[1] - a[1]);
      for (const [symptom, count] of sortedSymptoms) {
        doc.text(`${symptom}: ${count} time${count !== 1 ? "s" : ""}`, 40, y);
        y += 18;
        if (y > 780) { doc.addPage(); y = 40; }
      }
      y += 10;
      lineY(y); y += 20;
    }

    // Recent Log Entries
    if (logs.length > 0) {
      if (y > 700) { doc.addPage(); y = 40; }
      doc.font("Helvetica-Bold").fontSize(14).fillColor(brandColor).text("Recent Log Entries", 40, y);
      y += 24;
      const recentLogs = logs.slice(-10).reverse();
      for (const log of recentLogs) {
        if (y > 750) { doc.addPage(); y = 40; }
        const dateStr = log.logDate.toLocaleDateString();
        const vitalsParts: string[] = [];
        if (log.bloodPressureSystolic != null) vitalsParts.push(`BP ${log.bloodPressureSystolic}/${log.bloodPressureDiastolic ?? "?"}`);
        if (log.bloodSugar != null) vitalsParts.push(`BG ${log.bloodSugar}`);
        if (log.heartRate != null) vitalsParts.push(`HR ${log.heartRate}`);
        if (log.oxygenLevel != null) vitalsParts.push(`O2 ${log.oxygenLevel}%`);
        if (log.painLevel != null) vitalsParts.push(`Pain ${log.painLevel}/10`);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(brandColor).text(dateStr, 40, y);
        y += 14;
        const symptomsList = (log.symptoms as string[]) || [];
        if (symptomsList.length > 0) {
          doc.font("Helvetica").fontSize(9).fillColor(mutedColor).text(`Symptoms: ${symptomsList.slice(0, 4).join(", ")}${symptomsList.length > 4 ? "..." : ""}`, 50, y);
          y += 12;
        }
        if (vitalsParts.length > 0) {
          doc.font("Helvetica").fontSize(9).fillColor("#333333").text(vitalsParts.join(" | "), 50, y);
          y += 12;
        }
        const painLocations = (log.painLocation as string[]) || [];
        const mobilityIssues = (log.mobilityIssues as string[]) || [];
        if (painLocations.length > 0) {
          doc.font("Helvetica").fontSize(9).fillColor(mutedColor).text(`Pain locations: ${painLocations.join(", ")}`, 50, y);
          y += 12;
        }
        if (mobilityIssues.length > 0) {
          doc.font("Helvetica").fontSize(9).fillColor(mutedColor).text(`Mobility: ${mobilityIssues.join(", ")}`, 50, y);
          y += 12;
        }
        y += 4;
        lineY(y); y += 8;
      }
      y += 10;
    }

    // AI Predictions
    try {
      const predictions = await this.getPredictions(userId);
      if (predictions.length > 0) {
        if (y > 700) { doc.addPage(); y = 40; }
        doc.font("Helvetica-Bold").fontSize(14).fillColor(brandColor).text("AI Predictions & Insights", 40, y);
        y += 24;
        for (const p of predictions) {
          if (y > 750) { doc.addPage(); y = 40; }
          const severityColor = p.severity === "critical" ? "#dc2626" : p.severity === "warning" ? "#d97706" : "#666666";
          doc.font("Helvetica-Bold").fontSize(10).fillColor(severityColor)
            .text(`${p.metric}: ${p.severity.toUpperCase()}`, 40, y);
          y += 14;
          doc.font("Helvetica").fontSize(9).fillColor("#333333").text(p.message, 50, y);
          y += 12;
          if (p.recommendation) {
            doc.font("Helvetica-Oblique").fontSize(9).fillColor(mutedColor).text(`Recommendation: ${p.recommendation}`, 50, y);
            y += 12;
          }
          y += 4;
          lineY(y); y += 8;
        }
        y += 10;
      }
    } catch {
      // predictions failed - skip
    }

    // Footer
    doc.font("Helvetica-Oblique").fontSize(9).fillColor(mutedColor)
      .text("This report was generated by the Digital Health Assistant.", 40, y);

    doc.end();

    // Wait for write to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const pdfUrl = `/api/chronic-disease/reports/download/${pdfId}`;

    const report = await prisma.healthReport.create({
      data: {
        id: pdfId,
        userId,
        title,
        dateRange: { from, to },
        data: reportData,
        pdfUrl,
      },
    });

    return report;
  }

  async getReports(userId: string) {
    return prisma.healthReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getReportById(reportId: string, userId: string) {
    return prisma.healthReport.findFirst({
      where: { id: reportId, userId },
    });
  }

  async deleteReport(reportId: string, userId: string) {
    const report = await prisma.healthReport.findFirst({
      where: { id: reportId, userId },
    });
    if (!report) return;
    await prisma.healthReport.deleteMany({
      where: { id: reportId, userId },
    });
    const pdfPath = path.join(REPORTS_DIR, `${reportId}.pdf`);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  }

  // ─── Trends ────────────────────────────────────────────────────────────

  async getTrends(userId: string, conditionId?: string, period: "day" | "week" | "month" = "week") {
    const days = period === "day" ? 1 : period === "month" ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = { userId, logDate: { gte: since } };
    if (conditionId) where.conditionId = conditionId;

    const logs = await prisma.dailyHealthLog.findMany({
      where,
      orderBy: { logDate: "asc" },
    });

    const METRICS_CONFIG: Record<string, { unit: string }> = {
      bloodPressureSystolic: { unit: "mmHg" },
      bloodPressureDiastolic: { unit: "mmHg" },
      bloodSugar: { unit: "mg/dL" },
      heartRate: { unit: "bpm" },
      oxygenLevel: { unit: "%" },
      weight: { unit: "kg" },
      temperature: { unit: "°F" },
    };

    // Collect daily averages per metric
    const dailyMap: Record<string, Record<string, number[]>> = {};
    for (const log of logs) {
      const key = log.logDate.toISOString().split("T")[0];
      if (!dailyMap[key]) dailyMap[key] = {};
      const metrics: Record<string, number | null> = {
        bloodPressureSystolic: log.bloodPressureSystolic,
        bloodPressureDiastolic: log.bloodPressureDiastolic,
        bloodSugar: log.bloodSugar,
        heartRate: log.heartRate,
        oxygenLevel: log.oxygenLevel,
        weight: log.weight,
        temperature: log.temperature,
      };
      for (const [metric, value] of Object.entries(metrics)) {
        if (value != null) {
          if (!dailyMap[key][metric]) dailyMap[key][metric] = [];
          dailyMap[key][metric].push(value);
        }
      }
    }

    const dates = Object.keys(dailyMap).sort();
    if (dates.length === 0) return [];

    // Build per-metric TrendData
    const trendResults: Array<{ dates: string[]; values: number[]; metric: string; unit: string }> = [];
    for (const [metric, config] of Object.entries(METRICS_CONFIG)) {
      const values: number[] = [];
      const validDates: string[] = [];
      for (const date of dates) {
        const vals = dailyMap[date][metric];
        if (vals && vals.length > 0) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          values.push(parseFloat(avg.toFixed(2)));
          validDates.push(date);
        }
      }
      if (values.length >= 1) {
        trendResults.push({
          dates: validDates,
          values,
          metric,
          unit: config.unit,
        });
      }
    }

    return trendResults;
  }

  // ─── AI Predictions ──────────────────────────────────────────────────────

  async getPredictions(userId: string): Promise<IHealthPrediction[]> {
    const predictions: IHealthPrediction[] = [];

    const [
      logs,
      healthProfile,
      labReports,
      moodEntries,
      stressAssessments,
      userMedicines,
      patientConditions,
    ] = await Promise.all([
      prisma.dailyHealthLog.findMany({
        where: { userId, logDate: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { logDate: "asc" },
      }),
      prisma.healthProfile.findUnique({ where: { userId } }),
      prisma.labReport.findMany({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
        take: 5,
      }),
      prisma.moodEntry.findMany({
        where: { userId, date: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { date: "asc" },
      }),
      prisma.stressAssessment.findMany({
        where: { userId, date: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { date: "asc" },
      }),
      prisma.userMedicine.findMany({
        where: { userId },
        include: { doses: true },
      }),
      prisma.patientCondition.findMany({ where: { userId } }),
    ]);

    const hasVitalsData = logs.length >= 3;

    // ═════════════════════════════════════════════════════════════════════
    // 1. DailyHealthLog - Vitals trends (existing logic)
    // ═════════════════════════════════════════════════════════════════════

    if (hasVitalsData) {
      // ── Blood Sugar trend ──
      const sugarLogs = logs.filter((l) => l.bloodSugar != null);
      if (sugarLogs.length >= 3) {
        const recentSugar = sugarLogs.slice(-5);
        const sugarValues = recentSugar.map((l) => l.bloodSugar!);
        const sugarPct = this.calcPercentChange(sugarValues);
        const sugarConsecutive = this.countConsecutiveTrend(sugarValues, "increasing");
        if (sugarConsecutive >= 3 && sugarPct > 5) {
          predictions.push({
            type: "trend_warning", severity: sugarValues[sugarValues.length - 1] > 180 ? "critical" : "warning",
            metric: "bloodSugar", message: `Blood sugar has been increasing for ${sugarConsecutive} consecutive days`,
            trend: "increasing", percentageChange: sugarPct, consecutiveDays: sugarConsecutive,
            currentValue: `${sugarValues[sugarValues.length - 1]} mg/dL`,
            recommendation: "Monitor carbohydrate intake and consult your doctor about adjusting medication.",
          });
        }
      }

      // ── Blood Pressure trend ──
      const bpLogs = logs.filter((l) => l.bloodPressureSystolic != null);
      if (bpLogs.length >= 3) {
        const recentBP = bpLogs.slice(-5);
        const bpValues = recentBP.map((l) => l.bloodPressureSystolic!);
        const bpConsecutive = this.countConsecutiveAboveThreshold(bpValues, 130);
        if (bpConsecutive >= 3) {
          predictions.push({
            type: "trend_warning", severity: bpValues.some((v) => v > 140) ? "warning" : "info",
            metric: "bloodPressure", message: `Systolic BP consistently above 130 for ${bpConsecutive} readings`,
            trend: "increasing", percentageChange: this.calcPercentChange(bpValues), consecutiveDays: bpConsecutive,
            currentValue: `${bpValues[bpValues.length - 1]} mmHg`,
            recommendation: "Reduce sodium intake and monitor your BP daily. Consider consulting your physician.",
          });
        }
      }

      // ── Oxygen Level trend ──
      const oxyLogs = logs.filter((l) => l.oxygenLevel != null);
      if (oxyLogs.length >= 3) {
        const recentOxy = oxyLogs.slice(-5);
        const oxyValues = recentOxy.map((l) => l.oxygenLevel!);
        const lowOxyCount = oxyValues.filter((v) => v < 95).length;
        if (lowOxyCount >= 2) {
          predictions.push({
            type: "abnormal_pattern", severity: oxyValues.some((v) => v < 90) ? "critical" : "warning",
            metric: "oxygenLevel", message: `Low oxygen levels detected in ${lowOxyCount} of the last ${oxyValues.length} readings`,
            trend: "decreasing", percentageChange: this.calcPercentChange(oxyValues), consecutiveDays: lowOxyCount,
            currentValue: `${oxyValues[oxyValues.length - 1]}%`,
            recommendation: "Practice deep breathing exercises. If levels drop below 90%, seek immediate medical attention.",
          });
        }
      }

      // ── Weight trend from logs ──
      const weightLogs = logs.filter((l) => l.weight != null);
      if (weightLogs.length >= 4) {
        const recentWeight = weightLogs.slice(-6);
        const weightValues = recentWeight.map((l) => l.weight!);
        const weightPct = this.calcPercentChange(weightValues);
        if (Math.abs(weightPct) > 3) {
          predictions.push({
            type: "trend_warning",
            severity: Math.abs(weightPct) > 5 ? "warning" : "info",
            metric: "weight",
            message: `Weight has been ${weightPct > 0 ? "increasing" : "decreasing"} by ${Math.abs(weightPct).toFixed(1)}% recently`,
            trend: weightPct > 0 ? "increasing" : "decreasing",
            percentageChange: weightPct,
            consecutiveDays: recentWeight.length,
            currentValue: `${weightValues[weightValues.length - 1]} kg`,
            recommendation: weightPct > 0
              ? "Consider reviewing your diet and physical activity levels."
              : "Ensure you are maintaining a balanced diet. Consult your doctor if weight loss is unintentional.",
          });
        }
      }

      // ── Heart Rate trend ──
      const hrLogs = logs.filter((l) => l.heartRate != null);
      if (hrLogs.length >= 3) {
        const recentHR = hrLogs.slice(-5);
        const hrValues = recentHR.map((l) => l.heartRate!);
        const highHR = hrValues.filter((v) => v > 100).length;
        if (highHR >= 3) {
          predictions.push({
            type: "abnormal_pattern", severity: "warning",
            metric: "heartRate",
            message: `Elevated heart rate (>100 bpm) in ${highHR} of the last ${hrValues.length} readings`,
            trend: "increasing", percentageChange: this.calcPercentChange(hrValues), consecutiveDays: highHR,
            currentValue: `${hrValues[hrValues.length - 1]} bpm`,
            recommendation: "Practice relaxation techniques. Stay hydrated and avoid caffeine. Consult your doctor if persistent.",
          });
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 2. Pain & Mobility (from DailyHealthLog)
    // ═════════════════════════════════════════════════════════════════════

    if (hasVitalsData) {
      // ── Pain frequency ──
      const logsWithPain = logs.filter((l) => l.painLevel != null && l.painLevel > 0);
      if (logsWithPain.length >= 3) {
        const avgPain = logsWithPain.reduce((s, l) => s + (l.painLevel ?? 0), 0) / logsWithPain.length;
        const highPainDays = logsWithPain.filter((l) => (l.painLevel ?? 0) >= 7).length;
        if (avgPain >= 4) {
          predictions.push({
            type: "abnormal_pattern",
            severity: avgPain >= 7 || highPainDays >= 2 ? "warning" : "info",
            metric: "chronicPain",
            message: `Persistent pain detected: average ${avgPain.toFixed(1)}/10 over ${logsWithPain.length} entries${highPainDays > 0 ? ` (${highPainDays} days with severe pain ≥7)` : ""}`,
            trend: "stable", percentageChange: 0, consecutiveDays: logsWithPain.length,
            currentValue: `${avgPain.toFixed(1)}/10 average`,
            recommendation: "Track your pain triggers and discuss persistent pain with your doctor. Consider gentle stretching, heat/cold therapy, or prescribed pain management.",
          });
        }
      }

      // ── Pain locations ──
      const locationCounts = new Map<string, number>();
      for (const log of logs) {
        const locations = (log.painLocation as string[]) || [];
        for (const loc of locations) {
          locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
        }
      }
      if (locationCounts.size > 0) {
        const sortedLocs = [...locationCounts.entries()].sort((a, b) => b[1] - a[1]);
        const mostFrequent = sortedLocs.slice(0, 3);
        predictions.push({
          type: "abnormal_pattern", severity: "info",
          metric: "painLocation",
          message: `Most frequent pain locations: ${mostFrequent.map(([loc, count]) => `${loc} (${count}x)`).join(", ")}`,
          trend: "stable", percentageChange: 0, consecutiveDays: sortedLocs[0]?.[1] ?? 0,
          currentValue: mostFrequent.map(([loc]) => loc).join(", "),
          recommendation: "Note which activities worsen pain in these areas. Ergonomic adjustments and targeted exercises may help.",
        });
      }

      // ── Mobility issues ──
      const mobilityLogs = logs.filter((l) => l.mobilityIssues && Array.isArray(l.mobilityIssues) && l.mobilityIssues.length > 0);
      if (mobilityLogs.length >= 2) {
        const allIssues = new Map<string, number>();
        for (const log of mobilityLogs) {
          const issues = log.mobilityIssues as string[];
          for (const issue of issues) {
            allIssues.set(issue, (allIssues.get(issue) || 0) + 1);
          }
        }
        const topIssues = [...allIssues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        predictions.push({
          type: "abnormal_pattern",
          severity: topIssues.some(([_, count]) => count >= 3) ? "warning" : "info",
          metric: "mobility",
          message: `Mobility issues reported in ${mobilityLogs.length} entries: ${topIssues.map(([issue, count]) => `${issue} (${count}x)`).join(", ")}`,
          trend: "stable", percentageChange: 0, consecutiveDays: mobilityLogs.length,
          currentValue: topIssues.map(([issue]) => issue).join(", "),
          recommendation: "Consider physical therapy or gentle exercises like swimming or yoga. Use assistive devices if needed and consult a specialist.",
        });
      }

      // ── Pain & fatigue correlation ──
      const logsWithBoth = logs.filter((l) => l.painLevel != null && l.fatigueLevel != null);
      if (logsWithBoth.length >= 4) {
        const highPainAndFatigue = logsWithBoth.filter((l) => (l.painLevel ?? 0) >= 5 && (l.fatigueLevel ?? 0) >= 5);
        if (highPainAndFatigue.length >= 2) {
          predictions.push({
            type: "trend_warning", severity: "warning",
            metric: "painFatigue",
            message: `High pain and fatigue occurring together in ${highPainAndFatigue.length} of the last ${logsWithBoth.length} entries`,
            trend: "increasing", percentageChange: 0, consecutiveDays: highPainAndFatigue.length,
            currentValue: `${highPainAndFatigue.length} episodes`,
            recommendation: "When pain and fatigue co-occur, prioritize rest and gentle activity. Consider speaking with your doctor about symptom management strategies.",
          });
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 3. HealthProfile - Lifestyle & Goals
    // ═════════════════════════════════════════════════════════════════════

    if (healthProfile) {
      // ── Weight goal progress ──
      if (healthProfile.targetWeight && healthProfile.weight) {
        const currentWeight = healthProfile.weight;
        const target = healthProfile.targetWeight;
        const diff = currentWeight - target;
        const pctToGoal = Math.abs((diff / (currentWeight - target || 1)) * 100).toFixed(0);
        if (Math.abs(diff) > 5) {
          predictions.push({
            type: "trend_warning",
            severity: Math.abs(diff) > 15 ? "warning" : "info",
            metric: "weightGoal",
            message: diff > 0
              ? `You are ${diff.toFixed(1)} kg above your target weight of ${target} kg`
              : `You are ${Math.abs(diff).toFixed(1)} kg below your target weight of ${target} kg`,
            trend: diff > 0 ? "increasing" : "decreasing",
            percentageChange: parseFloat(pctToGoal),
            consecutiveDays: 0,
            currentValue: `${currentWeight} kg (target: ${target} kg)`,
            recommendation: diff > 0
              ? "Consider adjusting your calorie intake and increasing physical activity to reach your goal."
              : "Ensure you are eating enough nutrient-dense foods. Consult a nutritionist if weight loss is unintended.",
          });
        }
      }

      // ── Sleep quality ──
      if (healthProfile.sleepHours != null && healthProfile.sleepHours < 6) {
        predictions.push({
          type: "abnormal_pattern", severity: healthProfile.sleepHours < 5 ? "warning" : "info",
          metric: "sleep",
          message: `You average only ${healthProfile.sleepHours} hours of sleep per night (recommended: 7-9 hours)`,
          trend: "stable", percentageChange: 0, consecutiveDays: 0,
          currentValue: `${healthProfile.sleepHours} hours`,
          recommendation: "Establish a consistent sleep schedule and aim for 7-9 hours. Poor sleep can worsen chronic conditions.",
        });
      }

      // ── Water intake ──
      if (healthProfile.waterIntake != null && healthProfile.waterIntake < 5) {
        predictions.push({
          type: "abnormal_pattern", severity: "info",
          metric: "hydration",
          message: `Low water intake: ${healthProfile.waterIntake} glasses per day (recommended: 8+)`,
          trend: "stable", percentageChange: 0, consecutiveDays: 0,
          currentValue: `${healthProfile.waterIntake} glasses`,
          recommendation: "Increase your daily water intake to at least 8 glasses. Proper hydration supports overall health and organ function.",
        });
      }

      // ── Medical conditions not yet tracked ──
      const profileConditions: string[] = Array.isArray(healthProfile.medicalConditions)
        ? healthProfile.medicalConditions as string[]
        : [];
      const trackedConditionNames = patientConditions.map((pc) => pc.condition.toLowerCase());
      const untrackedConditions = profileConditions.filter(
        (c) => !trackedConditionNames.some((t) => c.toLowerCase().includes(t) || t.includes(c.toLowerCase()))
      );
      if (untrackedConditions.length > 0) {
        predictions.push({
          type: "abnormal_pattern", severity: "info",
          metric: "untrackedConditions",
          message: `${untrackedConditions.length} condition(s) from your health profile are not being tracked: ${untrackedConditions.join(", ")}`,
          trend: "stable", percentageChange: 0, consecutiveDays: 0,
          currentValue: untrackedConditions.join(", "),
          recommendation: "Add these conditions to your chronic disease tracker for better monitoring and personalized insights.",
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 4. LabReport - Biomarker alerts
    // ═════════════════════════════════════════════════════════════════════

    if (labReports.length > 0) {
      const latestReport = labReports[0];
      if (latestReport.biomarkers && Array.isArray(latestReport.biomarkers)) {
        const biomarkers = latestReport.biomarkers as Array<{
          name: string; value: string; unit?: string; status?: string; referenceRange?: string;
        }>;
        const abnormalBiomarkers = biomarkers.filter(
          (b) => b.status === "abnormal" || b.status === "critical"
        );
        if (abnormalBiomarkers.length > 0) {
          const criticalOnes = abnormalBiomarkers.filter((b) => b.status === "critical");
          predictions.push({
            type: "abnormal_pattern",
            severity: criticalOnes.length > 0 ? "critical" : "warning",
            metric: "labResults",
            message: `${abnormalBiomarkers.length} abnormal biomarker(s) in your latest lab report: ${abnormalBiomarkers.map((b) => b.name).join(", ")}`,
            trend: "stable",
            percentageChange: 0,
            consecutiveDays: 0,
            currentValue: abnormalBiomarkers.map((b) => `${b.name}: ${b.value}${b.unit ? " " + b.unit : ""}`).join("; "),
            recommendation: "Review these results with your healthcare provider. Consider repeat testing as recommended by your doctor.",
          });
        }

        // ── HbA1c for diabetes monitoring ──
        const hba1c = biomarkers.find(
          (b) => b.name.toLowerCase().includes("hba1c") || b.name.toLowerCase().includes("a1c")
        );
        if (hba1c) {
          const hba1cVal = parseFloat(hba1c.value);
          if (!isNaN(hba1cVal) && hba1cVal > 6.5) {
            predictions.push({
              type: "trend_warning",
              severity: hba1cVal > 8 ? "critical" : "warning",
              metric: "hba1c",
              message: `Your HbA1c is ${hba1cVal}% indicating elevated blood sugar levels over the past 3 months`,
              trend: "stable",
              percentageChange: 0,
              consecutiveDays: 0,
              currentValue: `${hba1cVal}% (target: <6.5%)`,
              recommendation: "Work with your doctor to manage your diabetes. Monitor blood sugar regularly and follow your treatment plan.",
            });
          }
        }

        // ── Cholesterol ──
        const cholesterol = biomarkers.find(
          (b) => b.name.toLowerCase().includes("cholesterol") && !b.name.toLowerCase().includes("hdl")
        );
        if (cholesterol) {
          const cholVal = parseFloat(cholesterol.value);
          if (!isNaN(cholVal) && cholVal > 200) {
            predictions.push({
              type: "trend_warning", severity: cholVal > 240 ? "warning" : "info",
              metric: "cholesterol",
              message: `Your total cholesterol is ${cholVal} mg/dL, which is above the recommended range`,
              trend: "stable", percentageChange: 0, consecutiveDays: 0,
              currentValue: `${cholVal} mg/dL (target: <200)`,
              recommendation: "Consider a heart-healthy diet low in saturated fats. Increase fiber intake and regular exercise.",
            });
          }
        }
      }

      // ── Lab report trend (multiple reports with same biomarker) ──
      if (labReports.length >= 2) {
        const allBiomarkers: Array<{ name: string; date: Date; value: number }> = [];
        for (const report of labReports) {
          if (report.biomarkers && Array.isArray(report.biomarkers)) {
            const bm = report.biomarkers as Array<{ name: string; value: string; unit?: string }>;
            for (const b of bm) {
              const numVal = parseFloat(b.value);
              if (!isNaN(numVal)) {
                allBiomarkers.push({ name: b.name, date: report.uploadedAt, value: numVal });
              }
            }
          }
        }

        const trackedBiomarkers = new Map<string, Array<{ date: Date; value: number }>>();
        for (const bm of allBiomarkers) {
          if (!trackedBiomarkers.has(bm.name)) trackedBiomarkers.set(bm.name, []);
          trackedBiomarkers.get(bm.name)!.push({ date: bm.date, value: bm.value });
        }

        for (const [name, values] of trackedBiomarkers) {
          if (values.length >= 2 && (name.toLowerCase().includes("hba1c") || name.toLowerCase().includes("cholesterol") || name.toLowerCase().includes("creatinine") || name.toLowerCase().includes("vitamin"))) {
            const sortedVals = values.sort((a, b) => a.date.getTime() - b.date.getTime());
            const first = sortedVals[0].value;
            const last = sortedVals[sortedVals.length - 1].value;
            const change = ((last - first) / first) * 100;
            if (Math.abs(change) > 10) {
              predictions.push({
                type: "trend_warning",
                severity: Math.abs(change) > 20 ? "warning" : "info",
                metric: name.replace(/\s+/g, ""),
                message: `${name} has ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(0)}% across your lab reports`,
                trend: change > 0 ? "increasing" : "decreasing",
                percentageChange: parseFloat(change.toFixed(2)),
                consecutiveDays: sortedVals.length,
                currentValue: `${last} (was ${first})`,
                recommendation: "Discuss these lab trends with your healthcare provider at your next visit.",
              });
            }
          }
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 5. MoodEntry - Emotional well-being
    // ═════════════════════════════════════════════════════════════════════

    if (moodEntries.length >= 3) {
      const recentMoods = moodEntries.slice(-7);
      const moodValues: number[] = recentMoods.map((m) => {
        const map: Record<string, number> = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
        return map[m.mood] ?? 3;
      });
      const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
      if (avgMood <= 2) {
        predictions.push({
          type: "abnormal_pattern", severity: "warning",
          metric: "mood",
          message: `Your average mood has been low recently (${avgMood.toFixed(1)}/5). ${moodValues.filter((v) => v <= 2).length} of the last ${moodValues.length} entries were negative`,
          trend: "decreasing", percentageChange: this.calcPercentChange(moodValues), consecutiveDays: moodValues.filter((v) => v <= 2).length,
          currentValue: `${avgMood.toFixed(1)}/5`,
          recommendation: "Consider talking to someone you trust or a mental health professional. Try stress-reducing activities like meditation or light exercise.",
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 6. StressAssessment - Stress levels
    // ═════════════════════════════════════════════════════════════════════

    if (stressAssessments.length >= 1) {
      const latestStress = stressAssessments[stressAssessments.length - 1];
      if (latestStress.level === "high" || latestStress.level === "severe") {
        predictions.push({
          type: "abnormal_pattern",
          severity: latestStress.level === "severe" ? "critical" : "warning",
          metric: "stress",
          message: `Your stress level is ${latestStress.level} (score: ${latestStress.score}/100)`,
          trend: stressAssessments.length >= 2 && stressAssessments[stressAssessments.length - 1].score > stressAssessments[0].score ? "increasing" : "stable",
          percentageChange: stressAssessments.length >= 2
            ? parseFloat((((stressAssessments[stressAssessments.length - 1].score - stressAssessments[0].score) / (stressAssessments[0].score || 1)) * 100).toFixed(2))
            : 0,
          consecutiveDays: 0,
          currentValue: `${latestStress.score}/100 (${latestStress.level})`,
          recommendation: "Practice stress management techniques: deep breathing, meditation, or gentle exercise. Consider speaking with a counselor if stress persists.",
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 7. UserMedicine - Medication adherence
    // ═════════════════════════════════════════════════════════════════════

    if (userMedicines.length > 0) {
      let totalDoses = 0;
      let takenDoses = 0;
      for (const med of userMedicines) {
        for (const schedule of med.doses) {
          totalDoses++;
          if (schedule.status === "taken") takenDoses++;
        }
      }
      if (totalDoses > 0) {
        const adherenceRate = (takenDoses / totalDoses) * 100;
        if (adherenceRate < 80) {
          predictions.push({
            type: "abnormal_pattern",
            severity: adherenceRate < 60 ? "critical" : "warning",
            metric: "medicationAdherence",
            message: `Medication adherence is at ${adherenceRate.toFixed(0)}% (${takenDoses}/${totalDoses} doses taken)`,
            trend: "stable", percentageChange: 0, consecutiveDays: totalDoses - takenDoses,
            currentValue: `${adherenceRate.toFixed(0)}% adherence`,
            recommendation: "Set reminders for your medications. Skipping doses can worsen your health conditions. Use the medicine adherence tracker to stay on schedule.",
          });
        }
      }

      // ── Conditions without medication ──
      const conditionsWithMeds = new Set<string>();
      for (const med of userMedicines) {
        conditionsWithMeds.add(med.name.toLowerCase());
      }
      const untreatedConditions = patientConditions.filter(
        (pc) => !conditionsWithMeds.has(pc.condition.toLowerCase()) && pc.condition.toLowerCase() !== "obesity"
      );
      if (untreatedConditions.length > 0 && patientConditions.length > 0) {
        predictions.push({
          type: "improvement", severity: "info",
          metric: "untreatedConditions",
          message: `${untreatedConditions.length} condition(s) (${untreatedConditions.map((c) => c.condition).join(", ")}) have no medications tracked`,
          trend: "stable", percentageChange: 0, consecutiveDays: 0,
          currentValue: untreatedConditions.map((c) => c.condition).join(", "),
          recommendation: "Add medications for these conditions in the Medicine Adherence tracker to ensure proper management.",
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 7. Holistic / Positive prediction
    // ═════════════════════════════════════════════════════════════════════

    const hasWarnings = predictions.some((p) => p.severity !== "info");
    const hasAnyData = logs.length >= 3 || healthProfile || labReports.length > 0 || moodEntries.length >= 3 || stressAssessments.length > 0 || userMedicines.length > 0;

    if (!hasWarnings && hasAnyData) {
      predictions.push({
        type: "improvement", severity: "info",
        metric: "overall", message: "Your health metrics appear stable with no concerning trends detected",
        trend: "stable", percentageChange: 0, consecutiveDays: 0,
        currentValue: "Stable", recommendation: "Keep up the good work! Continue monitoring regularly.",
      });
    }

    return predictions;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private calcPercentChange(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    if (first === 0) return 0;
    return parseFloat((((last - first) / first) * 100).toFixed(2));
  }

  private countConsecutiveTrend(values: number[], direction: "increasing" | "decreasing"): number {
    let count = 1;
    for (let i = values.length - 1; i > 0; i--) {
      if (direction === "increasing" && values[i] > values[i - 1]) count++;
      else if (direction === "decreasing" && values[i] < values[i - 1]) count++;
      else break;
    }
    return count;
  }

  private countConsecutiveAboveThreshold(values: number[], threshold: number): number {
    let count = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] > threshold) count++;
      else break;
    }
    return count;
  }

  private average(values: (number | null)[]): number | null {
    const valid = values.filter((v): v is number => v != null);
    if (valid.length === 0) return null;
    return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
  }

  private formatLogResponse(log: any): IHealthLogResponse {
    return {
      id: log.id,
      logDate: log.logDate.toISOString(),
      symptoms: log.symptoms || [],
      painLevel: log.painLevel ?? null,
      painLocation: log.painLocation || null,
      mobilityIssues: log.mobilityIssues || null,
      fatigueLevel: log.fatigueLevel ?? null,
      bloodPressureSystolic: log.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: log.bloodPressureDiastolic ?? null,
      bloodSugar: log.bloodSugar ?? null,
      heartRate: log.heartRate ?? null,
      oxygenLevel: log.oxygenLevel ?? null,
      weight: log.weight ?? null,
      temperature: log.temperature ?? null,
      medicationTaken: log.medicationTaken || [],
      notes: log.notes ?? null,
      condition: log.condition ?? null,
      alerts: log.alerts || [],
      createdAt: log.createdAt.toISOString(),
    };
  }

  private formatAlertResponse(alert: any): IHealthAlertResponse {
    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      message: alert.message,
      isRead: alert.isRead,
      createdAt: alert.createdAt.toISOString(),
    };
  }
}

export default new ChronicDiseaseService();
