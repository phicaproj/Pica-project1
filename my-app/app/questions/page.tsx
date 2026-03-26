"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, category: "Financial",        text: "Do you have a consistent revenue stream?"             },
  { id: 2, category: "Marketing",        text: "Do you have a high customer retention rate?"          },
  { id: 3, category: "Financial",        text: "Do you track your cash flow regularly?"                },
  { id: 4, category: "Human Resources",  text: "Do your employees receive regular training?"          },
  { id: 5, category: "Marketing",        text: "Do you have an active social media presence?"         },
  { id: 6, category: "Financial",        text: "Do you have an emergency business fund?"              },
  { id: 7, category: "Human Resources",  text: "Is your team satisfied with their work environment?"  },
  { id: 8, category: "Marketing",        text: "Do you consistently generate new leads?"              },
  { id: 9, category: "Human Resources",  text: "Do you have a clear HR policy in place?"              },
  { id: 10, category: "Financial",       text: "Are your profit margins healthy?"                     },
];

const OPTIONS = ["Yes", "No", "Sometimes"] as const;
type Option = typeof OPTIONS[number];

// Score weights
const SCORE_MAP: Record<Option, number> = { Yes: 10, Sometimes: 5, No: 0 };

// ─── Network background (canvas) ──────────────────────────────────────────────
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#f9a8d4", "#86efac", "#93c5fd", "#fde68a", "#c4b5fd"];
    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      });
      // Lines
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(180,180,200,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });
      // Dots
      dots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Gauge (SVG arc) ──────────────────────────────────────────────────────────
function Gauge({ score }: { score: number }) {
  const r = 110;
  const cx = 150;
  const cy = 150;
  const startAngle = 135;
  const endAngle = 405; // 270° sweep
  const sweep = 270;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const scoreFraction = score / 100;
  const scoreAngle = startAngle + scoreFraction * sweep;

  // Color segments: 0-40 red, 40-70 yellow, 70-100 green
  const segments = [
    { from: startAngle, to: startAngle + sweep * 0.4, color: "#ef4444" },
    { from: startAngle + sweep * 0.4, to: startAngle + sweep * 0.7, color: "#eab308" },
    { from: startAngle + sweep * 0.7, to: endAngle, color: "#22c55e" },
  ];

  return (
    <svg viewBox="0 0 300 300" className="w-64 h-64 mx-auto">
      {/* Track */}
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="#374151"
        strokeWidth={18}
        strokeLinecap="round"
      />
      {/* Colored segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={arcPath(seg.from, seg.to)}
          fill="none"
          stroke={seg.color}
          strokeWidth={18}
          strokeLinecap="butt"
          opacity={0.35}
        />
      ))}
      {/* Active arc up to score */}
      {score > 0 && (
        <path
          d={arcPath(startAngle, scoreAngle)}
          fill="none"
          stroke={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"}
          strokeWidth={18}
          strokeLinecap="round"
        />
      )}
      {/* Inner black circle */}
      <circle cx={cx} cy={cy} r={88} fill="#111827" />
      {/* Score text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={52} fontWeight="bold">
        {score}
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        fill={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"}
        fontSize={14}
      >
        {score >= 70 ? "Good Health" : score >= 40 ? "Moderate Risk" : "At Risk"}
      </text>
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function QuestionPage() {
  const [current, setCurrent] = useState(0); // 0-9
  const [answers, setAnswers] = useState<(Option | null)[]>(Array(10).fill(null));
  const [selected, setSelected] = useState<Option | null>(null);
  const [showResults, setShowResults] = useState(false);

  const question = QUESTIONS[current];

  const handleSelect = (option: Option) => {
    setSelected(option);
    const newAnswers = [...answers];
    newAnswers[current] = option;
    setAnswers(newAnswers);

    // Auto-advance after short delay
    setTimeout(() => {
      if (current < 9) {
        setCurrent((prev) => prev + 1);
        setSelected(null);
      } else {
        setShowResults(true);
      }
    }, 300);
  };

  // Calculate scores
  const calcScore = (category?: string) => {
    const relevant = QUESTIONS.filter((q) => !category || q.category === category);
    const total = relevant.reduce((sum, q) => {
      const ans = answers[q.id - 1];
      return sum + (ans ? SCORE_MAP[ans] : 0);
    }, 0);
    return Math.round((total / (relevant.length * 10)) * 100);
  };

  const overallScore = calcScore();
  const financialScore = calcScore("Financial");
  const marketingScore = calcScore("Marketing");
  const hrScore = calcScore("Human Resources");

  const statusLabel = (score: number) => {
    if (score >= 70) return { label: "Good", color: "text-green-400" };
    if (score >= 40) return { label: "Stable", color: "text-yellow-400" };
    return { label: "At Risk", color: "text-red-400" };
  };

  // ── Results page ──────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
        
        <img src="./images/image1.png" className="absolute inset-0 w-full h-full object-cover" />

        <div className="relative flex-1 flex flex-col">
          {/* Header */}
          <div className="pt-8 flex flex-col items-center gap-1">
            <Link href="/" className="absolute left-8 top-8 text-white text-sm underline hover:opacity-80 transition">
              Back to Homepage
            </Link>
            {/* Replace with your logo */}
            <img src="./images/logo.png" className="h-10 mt-2" />
          </div>

          {/* Results card */}
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 w-full max-w-lg mx-4 text-white">
              <h2 className="text-2xl font-bold text-center mb-6">Overall Business Health</h2>

              {/* Gauge */}
              <Gauge score={overallScore} />

              {/* Category scores */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: "Financial", score: financialScore },
                  { label: "Marketing", score: marketingScore },
                  { label: "Human Resources", score: hrScore },
                ].map(({ label, score }) => {
                  const { label: status, color } = statusLabel(score);
                  return (
                    <div
                      key={label}
                      className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col items-center gap-1"
                    >
                      <span className="text-sm text-gray-300 text-center">{label}</span>
                      <span className="text-4xl font-bold">{score}</span>
                      <span className={`text-sm font-medium ${color}`}>{status}</span>
                    </div>
                  );
                })}
              </div>

              {/* Retake */}
              <button
                onClick={() => {
                  setAnswers(Array(10).fill(null));
                  setCurrent(0);
                  setSelected(null);
                  setShowResults(false);
                }}
                className="mt-6 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 py-4 text-center text-sm text-white/60">
          © Beauvision 2024 . All rights reserved. Powered By{" "}
          <a href="https://sundimension.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition">
            SunDimension
          </a>
        </div>
      </div>
    );
  }

  // ── Question page ─────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      
      <img src="./images/image2.png" className="absolute inset-0 w-full h-full object-cover" />

      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="pt-8 flex flex-col items-center relative">
          <Link href="/" className="absolute left-8 top-0 text-gray-800 text-sm underline hover:opacity-70 transition">
            Back to Homepage
          </Link>
          
          <img src="./images/logo.png" className="h-10 mt-2" />
        </div>

        {/* Question card */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden" style={{ minHeight: "520px" }}>

            {/* Animated network background inside card */}
            <NetworkCanvas />

            {/* Card content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-10" style={{ minHeight: "520px" }}>
              {/* Progress */}
              <p className="text-gray-500 text-sm mb-16 tracking-wide">
                {current + 1}/10
              </p>

              {/* Question */}
              <p className="text-xl font-medium text-gray-800 text-center mb-10 max-w-md">
                {question.text}
              </p>

              {/* Options */}
              <div className="flex items-center gap-4">
                {OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`px-8 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      selected === option
                        ? "bg-teal-600 border-teal-600 text-white scale-105"
                        : "bg-white/70 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-sm text-gray-500 bg-white/60 backdrop-blur-sm">
        © Beauvision 2024 . All rights reserved. Powered By{" "}
        <a href="https://sundimension.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-600 transition">
          SunDimension
        </a>
      </div>
    </div>
  );
}