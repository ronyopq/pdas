const highlights = [
  {
    title: "মাসিক ওয়ার্ক প্ল্যান",
    text: "মাস শুরুর আগে কাজের প্ল্যান, ট্রাভেল, আউটপুট আর দায়িত্ব এক পাতায় সাজানো থাকবে।",
  },
  {
    title: "ডেইলি অ্যাক্টিভিটি",
    text: "দিনের কাজ, সময়, আউটপুট আর নোট সহজভাবে লিখে রাখা যাবে, মোবাইল বা ল্যাপটপ দুই জায়গা থেকেই।",
  },
  {
    title: "মাসিক রিপোর্ট",
    text: "মাস শেষে completed, pending আর next step দেখে দ্রুত রিপোর্ট তৈরি করা যাবে।",
  },
];

const steps = [
  "Work plan submit",
  "Daily activity update",
  "Pending task review",
  "Monthly report ready",
];

const formats = [
  { label: "Excel", note: "Monthly work plan export" },
  { label: "Word", note: "Monthly report format" },
  { label: "PDF", note: "Daily action schedule print" },
  { label: "Print", note: "One-click clean page output" },
];

const scheduleRows = [
  ["09:00", "School campaign coordination meeting", "Meeting notes shared"],
  ["11:30", "Field follow-up call with district focal", "Pending issue resolved"],
  ["14:00", "Travel and documentation update", "Register updated"],
  ["16:00", "Draft monthly report points", "Summary prepared"],
];

export default function App() {
  return (
    <main className="simple-site">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PRAAN Daily Activity System</span>
          <h1>একটি simple, clean, mobile-ready activity site</h1>
          <p className="hero-text">
            Monthly work plan, daily activity, pending task আর monthly report flow কে একটি সরল,
            readable এবং modern ওয়েব ইন্টারফেসে দেখানো হয়েছে।
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#sheet-preview">
              Daily sheet preview
            </a>
            <a className="secondary-link" href="#formats">
              Export formats
            </a>
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-window">
            <div className="mini-window-top">
              <span />
              <span />
              <span />
            </div>
            <div className="plan-pill">March 2026 plan</div>
            <h2>আজকের focus</h2>
            <ul className="focus-list">
              <li>Campaign meeting follow-up</li>
              <li>Field communication log update</li>
              <li>Travel note and output capture</li>
            </ul>
            <div className="status-ribbon">
              <strong>Pending check</strong>
              <span>2 task still open from yesterday</span>
            </div>
          </div>
        </div>
      </section>

      <section className="highlights">
        {highlights.map((item) => (
          <article className="feature-card" key={item.title}>
            <span className="feature-index">0{highlights.indexOf(item) + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="flow-band">
        <div>
          <span className="eyebrow">Simple workflow</span>
          <h2>এক পাতায় process বোঝা যায়</h2>
        </div>
        <div className="step-row">
          {steps.map((step) => (
            <div className="step-chip" key={step}>
              {step}
            </div>
          ))}
        </div>
      </section>

      <section className="sheet-preview" id="sheet-preview">
        <div className="section-copy">
          <span className="eyebrow">Daily sheet</span>
          <h2>তোমার দেওয়া register format-এর simple digital version</h2>
          <p>
            সময়, task description, output আর নিচে note রাখার জন্য clean layout রাখা হয়েছে যাতে print করলেও
            readable থাকে।
          </p>
        </div>

        <div className="sheet-card">
          <div className="sheet-header">
            <div>
              <strong>Daily Activity Register</strong>
              <span>09 March 2026</span>
            </div>
            <div className="sheet-badge">PRAAN</div>
          </div>

          <div className="sheet-table">
            <div className="sheet-table-head">
              <span>Time</span>
              <span>Task Description</span>
              <span>Output</span>
            </div>
            {scheduleRows.map((row) => (
              <div className="sheet-table-row" key={row[0]}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>

          <div className="note-box">
            <strong>Note</strong>
            <p>Pending field visit items will move to tomorrow after manager review.</p>
          </div>
        </div>
      </section>

      <section className="formats" id="formats">
        <div className="section-copy">
          <span className="eyebrow">Outputs</span>
          <h2>তোমার existing format অনুযায়ী export-ready direction</h2>
        </div>
        <div className="format-grid">
          {formats.map((item) => (
            <article className="format-card" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-panel">
        <div>
          <span className="eyebrow">Deployment</span>
          <h2>Directly deployed on Cloudflare Pages</h2>
        </div>
        <p>
          এই version-এ heavy app shell বাদ দিয়ে lightweight presentation-first site রাখা হয়েছে, যাতে
          load fast হয় এবং blank screen issue না থাকে।
        </p>
      </section>
    </main>
  );
}
