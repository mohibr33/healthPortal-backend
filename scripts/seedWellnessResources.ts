import prisma from "../src/config/database";

const resources = [
  {
    title: "Understanding Stress: Causes, Symptoms, and Management",
    slug: "understanding-stress-management",
    category: "stress_management" as const,
    excerpt: "Learn about the common causes of stress, how to recognize its symptoms, and effective strategies for managing it in your daily life.",
    content: `Stress is a natural response to challenging situations, but chronic stress can take a toll on your physical and mental health.

## Common Causes of Stress
- Work pressure and deadlines
- Financial concerns
- Relationship challenges
- Academic demands
- Major life changes

## Recognizing Stress Symptoms
Stress manifests differently for everyone. Common signs include:
- Irritability and mood swings
- Difficulty sleeping
- Fatigue and low energy
- Difficulty concentrating
- Physical tension and headaches

## Effective Stress Management Strategies
1. **Regular Exercise**: Even 30 minutes of moderate activity can boost your mood
2. **Mindful Breathing**: Practice deep breathing exercises to calm your nervous system
3. **Healthy Sleep Habits**: Aim for 7-9 hours of quality sleep
4. **Social Connection**: Talk to trusted friends or family members
5. **Time Management**: Prioritize tasks and take regular breaks

Remember, seeking help is a sign of strength, not weakness.`,
    author: "Wellness Team",
    readTime: 5,
    tags: ["stress", "mental health", "self-care", "wellness"],
  },
  {
    title: "The Power of Mindfulness: A Beginner's Guide",
    slug: "mindfulness-beginners-guide",
    category: "mental_health" as const,
    excerpt: "Discover how mindfulness can help reduce anxiety, improve focus, and enhance your overall quality of life.",
    content: `Mindfulness is the practice of being fully present and engaged in the current moment. It's a simple yet powerful tool for improving mental health.

## What is Mindfulness?
Mindfulness means paying attention to the present moment without judgment. It's about being aware of your thoughts, feelings, and sensations as they are.

## Benefits of Mindfulness
- Reduces stress and anxiety
- Improves focus and concentration
- Enhances emotional regulation
- Promotes better sleep
- Increases self-awareness

## Simple Mindfulness Exercises

### 5-Minute Breathing Meditation
1. Find a quiet space and sit comfortably
2. Close your eyes and breathe naturally
3. Focus your attention on your breath
4. When your mind wanders, gently bring it back
5. Continue for 5 minutes

### Mindful Walking
Pay attention to the sensation of your feet touching the ground, the movement of your body, and the air on your skin.

### Body Scan
Gradually bring your attention to different parts of your body, from your toes to the top of your head, noticing any sensations without judgment.

## Getting Started
Start with just 2-3 minutes daily and gradually increase. Consistency matters more than duration.`,
    author: "Wellness Team",
    readTime: 6,
    tags: ["mindfulness", "meditation", "mental health", "anxiety"],
  },
  {
    title: "Daily Self-Care Routine for Better Mental Health",
    slug: "daily-self-care-routine",
    category: "self_care" as const,
    excerpt: "Build a sustainable self-care routine that nurtures your mental, emotional, and physical wellbeing.",
    content: `Self-care is not selfish — it's essential for maintaining good mental health. Here's how to build a routine that works for you.

## Morning Self-Care
- Wake up at a consistent time
- Drink a glass of water
- Stretch for 5 minutes
- Eat a nutritious breakfast
- Set an intention for the day

## Midday Check-In
- Take a short walk during breaks
- Practice deep breathing for 2 minutes
- Eat lunch away from your desk
- Connect with a colleague or friend

## Evening Wind-Down
- Limit screen time 1 hour before bed
- Write in a journal
- Read a book
- Practice gratitude
- Prepare for the next day

## Weekly Self-Care Activities
- Schedule time for hobbies
- Exercise or move your body
- Connect with loved ones
- Do something creative
- Rest and recharge

Remember: self-care looks different for everyone. Find what works for you and make it a priority.`,
    author: "Wellness Team",
    readTime: 4,
    tags: ["self-care", "routine", "mental health", "wellness"],
  },
  {
    title: "Healthy Lifestyle Habits for Mental Wellness",
    slug: "healthy-lifestyle-mental-wellness",
    category: "healthy_lifestyle" as const,
    excerpt: "Explore how nutrition, exercise, and sleep habits directly impact your mental health and emotional wellbeing.",
    content: `Your lifestyle choices have a profound impact on your mental health. Here's how to optimize key areas of your life.

## Nutrition for Mental Health
- Eat a balanced diet rich in fruits, vegetables, and whole grains
- Include omega-3 fatty acids (found in fish, nuts, and seeds)
- Stay hydrated throughout the day
- Limit processed foods and added sugars
- Consider probiotic-rich foods for gut health

## Exercise and Mood
Regular physical activity releases endorphins and improves mood:
- Aim for 150 minutes of moderate exercise per week
- Find activities you enjoy (walking, dancing, swimming)
- Start small and gradually increase intensity
- Exercise outdoors when possible for added benefits

## Sleep Hygiene
Quality sleep is crucial for mental health:
- Maintain a consistent sleep schedule
- Create a relaxing bedtime routine
- Keep your bedroom cool, dark, and quiet
- Avoid caffeine and screens before bed
- Aim for 7-9 hours of sleep per night

## Social Connection
Humans are social creatures. Nurture your relationships by:
- Scheduling regular time with friends and family
- Joining groups or classes aligned with your interests
- Volunteering in your community
- Reaching out when you need support

Small, consistent changes lead to lasting improvements in your mental wellbeing.`,
    author: "Wellness Team",
    readTime: 7,
    tags: ["healthy lifestyle", "nutrition", "exercise", "sleep", "mental health"],
  },
  {
    title: "Coping with Anxiety: Practical Techniques That Work",
    slug: "coping-with-anxiety-techniques",
    category: "mental_health" as const,
    excerpt: "Evidence-based techniques to help you manage anxiety symptoms and regain a sense of calm and control.",
    content: `Anxiety is one of the most common mental health challenges. These practical techniques can help you manage symptoms.

## Grounding Techniques

### 5-4-3-2-1 Technique
When feeling anxious, try this grounding exercise:
- Name 5 things you can see
- Name 4 things you can touch
- Name 3 things you can hear
- Name 2 things you can smell
- Name 1 thing you can taste

### Deep Breathing
The 4-7-8 breathing technique:
1. Inhale quietly through your nose for 4 seconds
2. Hold your breath for 7 seconds
3. Exhale completely through your mouth for 8 seconds
4. Repeat 4 times

## Cognitive Strategies
- Challenge negative thoughts by asking for evidence
- Practice realistic thinking rather than catastrophizing
- Use positive affirmations
- Focus on what you can control

## Lifestyle Adjustments
- Reduce caffeine and alcohol intake
- Establish a regular sleep routine
- Exercise regularly
- Practice daily mindfulness
- Limit news and social media exposure

## When to Seek Help
If anxiety significantly impacts your daily life, consider speaking with a mental health professional. You don't have to face this alone.`,
    author: "Wellness Team",
    readTime: 5,
    tags: ["anxiety", "coping", "mental health", "breathing exercises"],
  },
  {
    title: "The Connection Between Sleep and Mental Health",
    slug: "sleep-and-mental-health",
    category: "healthy_lifestyle" as const,
    excerpt: "Understanding the bidirectional relationship between sleep quality and mental health, with tips for better rest.",
    content: `Sleep and mental health are deeply interconnected. Poor sleep can worsen mental health conditions, and mental health issues can disrupt sleep.

## The Sleep-Mental Health Cycle
- Poor sleep increases stress and anxiety
- Anxiety makes it harder to fall asleep
- This creates a challenging cycle

## How Sleep Affects Your Brain
- Emotional regulation improves with adequate sleep
- Memory consolidation occurs during deep sleep
- Stress hormones decrease during restful sleep
- Cognitive function and decision-making improve

## Tips for Better Sleep

### Create a Sleep Sanctuary
- Keep your bedroom dark, quiet, and cool
- Invest in a comfortable mattress and pillows
- Use blackout curtains if needed
- Consider a white noise machine

### Establish a Bedtime Routine
- Go to bed and wake up at the same time daily
- Avoid screens 60 minutes before bed
- Read a book or listen to calming music
- Practice gentle stretching or meditation
- Write down worries to clear your mind

### Avoid Sleep Disruptors
- Caffeine after 2 PM
- Heavy meals close to bedtime
- Alcohol before bed (disrupts REM sleep)
- Intense exercise in the evening
- Napping after 3 PM

Quality sleep is one of the most powerful tools for maintaining good mental health.`,
    author: "Wellness Team",
    readTime: 5,
    tags: ["sleep", "mental health", "insomnia", "healthy lifestyle"],
  },
  {
    title: "Building Emotional Resilience: A Step-by-Step Guide",
    slug: "building-emotional-resilience",
    category: "self_care" as const,
    excerpt: "Learn how to develop emotional resilience to better handle life's challenges and bounce back from adversity.",
    content: `Emotional resilience is the ability to adapt to stressful situations and bounce back from adversity. The good news is that resilience can be developed and strengthened over time.

## What is Emotional Resilience?
Resilience isn't about avoiding stress or difficult emotions. It's about developing the capacity to work through challenges and grow from them.

## Key Components of Resilience
1. **Self-Awareness**: Understanding your emotions and reactions
2. **Self-Regulation**: Managing your emotional responses
3. **Optimism**: Maintaining a hopeful outlook
4. **Connection**: Building supportive relationships
5. **Purpose**: Having a sense of meaning and direction

## Building Your Resilience

### Develop a Growth Mindset
View challenges as opportunities for growth rather than threats. Ask yourself: "What can I learn from this?"

### Build Strong Relationships
Cultivate connections with people who support and encourage you. Don't hesitate to ask for help when needed.

### Practice Self-Compassion
Treat yourself with the same kindness you would offer a friend. Acknowledge your struggles without judgment.

### Maintain Perspective
When facing a challenge, ask yourself:
- Will this matter in a year?
- What's within my control?
- What would I advise a friend in this situation?

### Take Care of Your Body
Physical health supports mental resilience. Prioritize sleep, nutrition, and exercise.

Remember: resilience is not about going it alone. Seeking support is a sign of strength.`,
    author: "Wellness Team",
    readTime: 6,
    tags: ["resilience", "emotional health", "self-care", "mental health"],
  },
  {
    title: "Digital Detox: Reducing Screen Time for Better Mental Health",
    slug: "digital-detox-mental-health",
    category: "self_care" as const,
    excerpt: "Practical strategies for reducing screen time and creating healthier relationships with technology.",
    content: `Excessive screen time and social media use can negatively impact mental health. A digital detox can help restore balance.

## Signs You May Need a Digital Detox
- Feeling anxious when away from your phone
- Checking social media first thing in the morning
- Comparing yourself to others online
- Difficulty concentrating without checking your device
- Physical discomfort (eye strain, headaches, neck pain)

## Benefits of Reducing Screen Time
- Improved sleep quality
- Reduced anxiety and stress
- Better focus and productivity
- More time for real-world connections
- Increased physical activity

## How to Start Your Digital Detox

### Start Small
- Designate tech-free times (e.g., during meals)
- Create phone-free zones (e.g., bedroom)
- Turn off non-essential notifications
- Set app timers for social media

### Replace Screen Time
Identify activities to replace scrolling:
- Read a physical book
- Go for a walk in nature
- Call a friend instead of texting
- Try a new hobby
- Practice meditation or journaling

### Create Healthy Boundaries
- No phones for the first 30 minutes after waking
- No screens 1 hour before bed
- Schedule regular digital-free weekends
- Use grayscale mode to reduce visual stimulation

The goal isn't to eliminate technology but to create a healthier relationship with it.`,
    author: "Wellness Team",
    readTime: 4,
    tags: ["digital detox", "screen time", "mental health", "self-care"],
  },
  {
    title: "Understanding and Managing Work-Life Balance",
    slug: "work-life-balance-guide",
    category: "stress_management" as const,
    excerpt: "Practical strategies for maintaining a healthy work-life balance in today's demanding world.",
    content: `Achieving work-life balance is essential for mental health and overall wellbeing. Here's how to create more balance in your life.

## Signs of Poor Work-Life Balance
- Constantly thinking about work during personal time
- Feeling guilty when not working
- Neglecting relationships and hobbies
- Chronic fatigue and burnout
- Declining physical health

## Strategies for Better Balance

### Set Clear Boundaries
- Define specific work hours and stick to them
- Create a dedicated workspace separate from living areas
- Learn to say no to non-essential commitments
- Turn off work notifications after hours

### Prioritize Your Time
Use the Eisenhower Matrix to prioritize:
- **Urgent & Important**: Do immediately
- **Important but Not Urgent**: Schedule
- **Urgent but Not Important**: Delegate
- **Neither**: Eliminate

### Make Time for What Matters
Schedule non-negotiables:
- Family time and meals together
- Exercise and physical activity
- Hobbies and personal interests
- Rest and relaxation
- Social connections

### Practice the 80/20 Rule
Focus on the 20% of activities that produce 80% of your results. Eliminate or delegate the rest.

Remember: perfect balance doesn't exist. Aim for harmony rather than perfection, and adjust as your circumstances change.`,
    author: "Wellness Team",
    readTime: 5,
    tags: ["work-life balance", "stress management", "burnout", "productivity"],
  },
  {
    title: "Gratitude Practice: Rewiring Your Brain for Happiness",
    slug: "gratitude-practice-happiness",
    category: "mental_health" as const,
    excerpt: "Discover how a daily gratitude practice can rewire your brain, improve mood, and increase overall life satisfaction.",
    content: `Gratitude is one of the most powerful and accessible tools for improving mental health. Research shows that regular gratitude practice can rewire your brain for greater happiness.

## The Science of Gratitude
Studies have shown that practicing gratitude:
- Increases dopamine and serotonin levels
- Improves sleep quality
- Reduces stress and anxiety
- Strengthens relationships
- Boosts immune function

## Simple Gratitude Practices

### 3 Things Gratitude Journal
Each day, write down three things you're grateful for. They can be as simple as:
- A warm cup of tea
- A kind message from a friend
- A beautiful sunset

### Gratitude Letter
Write a letter expressing gratitude to someone who has positively impacted your life. You don't have to send it — the act of writing is powerful.

### Gratitude Walk
During your next walk, consciously notice and appreciate things around you:
- The warmth of the sun
- Birds singing
- Trees and flowers
- The ability to walk

### Before Bed Reflection
As you lie in bed, think of one good thing that happened today. Let that thought be the last thing on your mind before sleep.

## Making It a Habit
- Link gratitude practice to an existing habit (e.g., after brushing your teeth)
- Use a dedicated notebook or app
- Start small — even one minute daily makes a difference
- Share your gratitude with others

The more you practice gratitude, the more your brain naturally looks for things to appreciate.`,
    author: "Wellness Team",
    readTime: 4,
    tags: ["gratitude", "happiness", "mental health", "positive psychology"],
  },
];

async function seedWellnessResources() {
  console.log("Seeding wellness resources...");

  let created = 0;
  let skipped = 0;

  for (const resource of resources) {
    const existing = await prisma.wellnessResource.findUnique({
      where: { slug: resource.slug },
    });

    if (existing) {
      console.log(`  SKIP: "${resource.title}" already exists`);
      skipped++;
      continue;
    }

    await prisma.wellnessResource.create({ data: resource });
    console.log(`  CREATED: "${resource.title}"`);
    created++;
  }

  console.log(`\nDone! ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

seedWellnessResources().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
