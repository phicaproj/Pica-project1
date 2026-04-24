import {  Phase, RiskType } from "@prisma/client";
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { DATABASE_URL } from '../src/Config/env'

const { PrismaClient } = pkg

const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
})

const prisma = new PrismaClient({
    adapter,
})

// ============================================================
// TYPES
// ============================================================

interface OptionSeed {
  label: string;
  text: string;
  score: number;
  riskType: RiskType;
  observation: string;
  recommendation: string;
}

interface QuestionSeed {
  code: string;
  text: string;
  hasKnockoutOption: boolean;
  options: OptionSeed[];
}

interface PillarSeed {
  code: string;
  name: string;
  description: string;
  weight: number;
  displayOrder: number;
  questions: QuestionSeed[];
}

// ============================================================
// SEED DATA
// 2 questions per pillar — fixed for Phase 1
// Equal weighting across 7 pillars (100 / 7 = 14.28)
// ============================================================

const PILLARS: PillarSeed[] = [
  // ──────────────────────────────────────────────────────────
  // PILLAR 1: Founder & Leadership
  // ──────────────────────────────────────────────────────────
  {
    code: "FL",
    name: "Founder & Leadership",
    description:
      "Assesses the founder's time commitment, focus, and leadership capacity.",
    weight: 14.28,
    displayOrder: 1,
    questions: [
      {
        code: "FL-001",
        text: "How is your professional work week practically structured?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Solely focused on this business (40+ hrs/week).",
            score: 10,
            riskType: "NORMAL",
            observation: "High focus.",
            recommendation: "Maintain this; you are in the Growth Zone.",
          },
          {
            label: "B",
            text: "Full-time here, but managing 2+ other side-ventures.",
            score: 5,
            riskType: "RISK",
            observation: "Focus is diluted.",
            recommendation: "Audit your time; exit non-core projects.",
          },
          {
            label: "C",
            text: "Working here part-time while employed elsewhere.",
            score: 3,
            riskType: "RISK",
            observation: "Side-hustle status.",
            recommendation: "Build a Resignation Roadmap to go full-time.",
          },
          {
            label: "D",
            text: "I only spend a few hours a month on this business.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Critical Risk.",
            recommendation:
              "Re-evaluate if this is a business or a hobby before seeking funds.",
          },
        ],
      },
      {
        code: "FL-002",
        text: "Can your Senior Management Team (SMT) execute the quarterly strategy without a daily briefing from you?",
        hasKnockoutOption: false,
        options: [
          {
            label: "A",
            text: "Yes — independent execution with no daily input needed.",
            score: 10,
            riskType: "NORMAL",
            observation:
              "You operate at Commander level with a self-regulating leadership layer.",
            recommendation:
              "Audit last 10 SMT decisions for alignment with strategy and identify one high-impact initiative to lead.",
          },
          {
            label: "B",
            text: "Mostly — but managers still wait for my final approval.",
            score: 7,
            riskType: "RISK",
            observation:
              "Managers execute but still depend on your approval for most decisions.",
            recommendation:
              "Define approval thresholds and exit one operational unit for 2 weeks as an autonomy test.",
          },
          {
            label: "C",
            text: "Not really — I intervene frequently to fix things.",
            score: 3,
            riskType: "RISK",
            observation:
              "You are the execution bottleneck; leadership layer is underdeveloped.",
            recommendation:
              "Identify the top 5 decisions you still control daily and create a Standard of Excellence playbook.",
          },
          {
            label: "D",
            text: "No — there is no management layer; I run everything.",
            score: 0,
            riskType: "KNOCKOUT",
            observation:
              "Structure mismatch; high burnout and collapse risk.",
            recommendation:
              "Identify 2 internal leadership potentials and hire or appoint a GM/COO by Day 45.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 2: Financial Readiness
  // ──────────────────────────────────────────────────────────
  {
    code: "FR",
    name: "Financial Readiness",
    description:
      "Evaluates the business's financial tracking, visibility, and discipline.",
    weight: 14.28,
    displayOrder: 2,
    questions: [
      {
        code: "FR-001",
        text: "How do you track your finances?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Structured accounting system (software + reports).",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong financial control.",
            recommendation: "Maintain and review monthly.",
          },
          {
            label: "B",
            text: "Basic tracking (Excel/manual records).",
            score: 6,
            riskType: "RISK",
            observation: "Limited visibility.",
            recommendation: "Upgrade to a structured accounting system.",
          },
          {
            label: "C",
            text: "Informal tracking (notes/memory).",
            score: 3,
            riskType: "RISK",
            observation: "High financial uncertainty.",
            recommendation: "Implement basic bookkeeping immediately.",
          },
          {
            label: "D",
            text: "No tracking at all.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "No financial visibility.",
            recommendation: "Immediate financial system setup required.",
          },
        ],
      },
      {
        code: "FR-002",
        text: "How clearly and frequently do you see your financial position?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Real-time visibility with structured reports.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong financial control and awareness.",
            recommendation:
              "Review last 3 months P&L, cash flow and expenses; set a weekly financial review meeting.",
          },
          {
            label: "B",
            text: "Monthly reports but with limited depth.",
            score: 7,
            riskType: "RISK",
            observation: "Moderate visibility; slow decision-making.",
            recommendation:
              "Introduce weekly cash flow tracking and build a simplified financial dashboard.",
          },
          {
            label: "C",
            text: "Occasional or irregular visibility.",
            score: 3,
            riskType: "RISK",
            observation: "Weak financial awareness.",
            recommendation:
              "Set up bookkeeping software and reconstruct the last 3–6 months of financial data.",
          },
          {
            label: "D",
            text: "No financial visibility at all.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Critical financial risk.",
            recommendation:
              "Hire an accountant/bookkeeper immediately and separate personal and business finances.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 3: Business Model
  // ──────────────────────────────────────────────────────────
  {
    code: "BM",
    name: "Business Model",
    description:
      "Examines the clarity of the target customer, value proposition, and revenue logic.",
    weight: 14.28,
    displayOrder: 3,
    questions: [
      {
        code: "BM-001",
        text: "How clearly defined is your target customer?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Clearly defined and segmented.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong market clarity.",
            recommendation: "Maintain and refine targeting.",
          },
          {
            label: "B",
            text: "General idea but not specific segments.",
            score: 6,
            riskType: "RISK",
            observation: "Weak targeting.",
            recommendation: "Define customer segments clearly.",
          },
          {
            label: "C",
            text: "Broad 'everyone can buy' approach.",
            score: 3,
            riskType: "RISK",
            observation: "Poor positioning.",
            recommendation: "Narrow your focus market.",
          },
          {
            label: "D",
            text: "No defined customer.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "No market clarity.",
            recommendation: "Define target market immediately.",
          },
        ],
      },
      {
        code: "BM-002",
        text: "How structured and predictable is your revenue model?",
        hasKnockoutOption: false,
        options: [
          {
            label: "A",
            text: "Predictable, repeatable, and diversified revenue.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong revenue engine with stability and scalability.",
            recommendation:
              "Identify top 2 revenue drivers by profitability and define one scaling lever.",
          },
          {
            label: "B",
            text: "Some repeat revenue but inconsistent flow.",
            score: 7,
            riskType: "RISK",
            observation: "Semi-stable revenue with growth gaps.",
            recommendation:
              "Map all revenue streams and introduce one recurring revenue offer.",
          },
          {
            label: "C",
            text: "Mostly one-off or irregular income.",
            score: 3,
            riskType: "RISK",
            observation: "Unstable and unpredictable revenue.",
            recommendation:
              "Build a subscription or retainer model and create a basic sales forecast.",
          },
          {
            label: "D",
            text: "No clear revenue structure.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Weak or undefined business model.",
            recommendation:
              "Define your primary revenue source and validate willingness to pay through customer interviews.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 4: Operations
  // ──────────────────────────────────────────────────────────
  {
    code: "OP",
    name: "Operations",
    description:
      "Measures operational independence, systems strength, and founder dependency.",
    weight: 14.28,
    displayOrder: 4,
    questions: [
      {
        code: "OP-001",
        text: "Can your business run without you for 5–7 days?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Yes, fully system-driven.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong operational system.",
            recommendation: "Maintain and optimize.",
          },
          {
            label: "B",
            text: "Partially, but issues arise.",
            score: 6,
            riskType: "RISK",
            observation: "Weak systems.",
            recommendation: "Strengthen SOPs and delegation.",
          },
          {
            label: "C",
            text: "No, I am required daily.",
            score: 3,
            riskType: "RISK",
            observation: "Founder dependency.",
            recommendation: "Build operational structure.",
          },
          {
            label: "D",
            text: "Business stops completely without me.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Critical dependency.",
            recommendation: "Urgent system development required.",
          },
        ],
      },
      {
        code: "OP-002",
        text: "How well do you understand and control your costs?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Clearly defined and optimized cost structure.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong cost discipline.",
            recommendation:
              "Break down all cost categories and set a cost monitoring system.",
          },
          {
            label: "B",
            text: "Some understanding but not optimized.",
            score: 7,
            riskType: "RISK",
            observation: "Hidden inefficiencies present.",
            recommendation:
              "Categorize all expenses and identify unnecessary costs.",
          },
          {
            label: "C",
            text: "Limited cost awareness.",
            score: 3,
            riskType: "RISK",
            observation: "Financial leakages present.",
            recommendation:
              "Track all expenses for 30 days and build a cost structure framework.",
          },
          {
            label: "D",
            text: "No cost control system in place.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "High financial inefficiency.",
            recommendation:
              "Build a cost tracking system immediately and assign expense approval authority.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 5: Market & Sales
  // ──────────────────────────────────────────────────────────
  {
    code: "MS",
    name: "Market & Sales",
    description:
      "Reviews customer acquisition channels, sales process effectiveness, and market positioning.",
    weight: 14.28,
    displayOrder: 5,
    questions: [
      {
        code: "MS-001",
        text: "How do you currently get customers?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Structured and predictable channels.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong acquisition system.",
            recommendation: "Scale winning channels.",
          },
          {
            label: "B",
            text: "Mix of referrals and occasional effort.",
            score: 6,
            riskType: "RISK",
            observation: "Inconsistent acquisition.",
            recommendation: "Build a structured marketing system.",
          },
          {
            label: "C",
            text: "Mostly random or occasional.",
            score: 3,
            riskType: "RISK",
            observation: "Unstable demand.",
            recommendation: "Develop a clear go-to-market strategy.",
          },
          {
            label: "D",
            text: "No clear acquisition method.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "No demand system.",
            recommendation: "Immediate marketing strategy needed.",
          },
        ],
      },
      {
        code: "MS-002",
        text: "How structured and effective is your sales process?",
        hasKnockoutOption: false,
        options: [
          {
            label: "A",
            text: "Defined process with high conversion rates.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong sales engine.",
            recommendation:
              "Review conversion rates at each stage and document the full sales process.",
          },
          {
            label: "B",
            text: "Some structure but inconsistent results.",
            score: 7,
            riskType: "RISK",
            observation: "Weak sales consistency.",
            recommendation:
              "Map your sales funnel stages and introduce a sales tracking system.",
          },
          {
            label: "C",
            text: "Informal or unstructured sales approach.",
            score: 3,
            riskType: "RISK",
            observation: "Low conversion efficiency.",
            recommendation:
              "Define the sales process step-by-step and create a simple pitch structure.",
          },
          {
            label: "D",
            text: "No defined sales process.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Lost revenue opportunities.",
            recommendation:
              "Build a sales process from scratch and define all stages from lead to close.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 6: Governance & Culture
  // ──────────────────────────────────────────────────────────
  {
    code: "GC",
    name: "Governance & Culture",
    description:
      "Assesses role clarity, documented policies, and organizational accountability.",
    weight: 14.28,
    displayOrder: 6,
    questions: [
      {
        code: "GC-001",
        text: "How clearly are roles and responsibilities defined in your business?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Clearly defined with structure and accountability.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong organizational clarity.",
            recommendation: "Maintain and refine role clarity.",
          },
          {
            label: "B",
            text: "Mostly defined but overlaps exist.",
            score: 6,
            riskType: "RISK",
            observation: "Some confusion in execution.",
            recommendation: "Clarify roles and reduce overlaps.",
          },
          {
            label: "C",
            text: "Informal understanding of roles.",
            score: 3,
            riskType: "RISK",
            observation: "Lack of structure.",
            recommendation: "Document roles and responsibilities.",
          },
          {
            label: "D",
            text: "No defined roles at all.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Chaotic structure.",
            recommendation: "Immediate role definition required.",
          },
        ],
      },
      {
        code: "GC-002",
        text: "Do you have documented policies and systems guiding operations?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Yes, clearly documented and actively used.",
            score: 10,
            riskType: "NORMAL",
            observation: "Strong governance system.",
            recommendation: "Maintain and review periodically.",
          },
          {
            label: "B",
            text: "Some policies exist but are not enforced.",
            score: 6,
            riskType: "RISK",
            observation: "Weak implementation.",
            recommendation: "Strengthen enforcement.",
          },
          {
            label: "C",
            text: "Mostly informal practices.",
            score: 3,
            riskType: "RISK",
            observation: "Inconsistent operations.",
            recommendation: "Formalize key policies.",
          },
          {
            label: "D",
            text: "No policies or systems in place.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "No governance structure.",
            recommendation: "Develop policies urgently.",
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // PILLAR 7: Scalability & Sustainability
  // ──────────────────────────────────────────────────────────
  {
    code: "SS",
    name: "Scalability & Sustainability",
    description:
      "Determines whether the business can grow, replicate, and adapt without the founder.",
    weight: 14.28,
    displayOrder: 7,
    questions: [
      {
        code: "SS-001",
        text: "Can your business be replicated without your direct involvement?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Yes, systems allow full replication.",
            score: 10,
            riskType: "NORMAL",
            observation: "High scalability potential.",
            recommendation: "Expand strategically.",
          },
          {
            label: "B",
            text: "Partially replicable.",
            score: 6,
            riskType: "RISK",
            observation: "Limited scalability.",
            recommendation: "Strengthen systems.",
          },
          {
            label: "C",
            text: "Difficult to replicate.",
            score: 3,
            riskType: "RISK",
            observation: "Founder dependency.",
            recommendation: "Build structured processes.",
          },
          {
            label: "D",
            text: "Cannot be replicated at all.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "Not scalable.",
            recommendation: "Redesign business model.",
          },
        ],
      },
      {
        code: "SS-002",
        text: "How consistent is demand for your product or service?",
        hasKnockoutOption: true,
        options: [
          {
            label: "A",
            text: "Strong and growing demand.",
            score: 10,
            riskType: "NORMAL",
            observation: "Positive growth trend.",
            recommendation: "Scale supply to meet demand.",
          },
          {
            label: "B",
            text: "Moderate but inconsistent demand.",
            score: 6,
            riskType: "RISK",
            observation: "Unstable demand.",
            recommendation: "Improve marketing systems.",
          },
          {
            label: "C",
            text: "Occasional demand only.",
            score: 3,
            riskType: "RISK",
            observation: "Weak market traction.",
            recommendation: "Refine your value proposition.",
          },
          {
            label: "D",
            text: "No consistent demand.",
            score: 0,
            riskType: "KNOCKOUT",
            observation: "No market validation.",
            recommendation: "Reassess market fit immediately.",
          },
        ],
      },
    ],
  },
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function main() {
  console.log("🌱 Seeding PICA Phase 1 data...\n");

  for (const pillarData of PILLARS) {
    const { questions, ...pillarFields } = pillarData;

    // Upsert pillar — safe to re-run without duplicates
    const pillar = await prisma.pillar.upsert({
      where: { code: pillarFields.code },
      update: {},
      create: {
        code: pillarFields.code,
        name: pillarFields.name,
        description: pillarFields.description,
        phase: Phase.PHASE1,
        weight: pillarFields.weight,
        displayOrder: pillarFields.displayOrder,
        isActive: true,
      },
    });

    console.log(`✅ Pillar: ${pillar.code} — ${pillar.name}`);

    for (const questionData of questions) {
      const { options, ...questionFields } = questionData;

      // Upsert question
      const question = await prisma.question.upsert({
        where: { questionCode: questionFields.code },
        update: {},
        create: {
          pillarId: pillar.id,
          questionCode: questionFields.code,
          questionText: questionFields.text,
          phase: Phase.PHASE1,
          displayOrder: questions.indexOf(questionData) + 1,
          hasKnockoutOption: questionFields.hasKnockoutOption,
          isActive: true,
        },
      });

      console.log(`   📝 Question: ${question.questionCode}`);

      for (const [index, optionData] of options.entries()) {
        // Upsert option — unique on questionId + optionLabel
        await prisma.questionOption.upsert({
          where: {
            questionId_optionLabel: {
              questionId: question.id,
              optionLabel: optionData.label,
            },
          },
          update: {},
          create: {
            questionId: question.id,
            optionLabel: optionData.label,
            optionText: optionData.text,
            score: optionData.score,
            riskType: optionData.riskType,
            observation: optionData.observation,
            recommendation: optionData.recommendation,
            displayOrder: index + 1,
          },
        });
      }

      console.log(`      ↳ ${options.length} options seeded`);
    }
  }

  console.log("\n🎉 Seed complete.");
  console.log(
    `   ${PILLARS.length} pillars | ${PILLARS.length * 2} questions | ${PILLARS.length * 2 * 4} options`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });