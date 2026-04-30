import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const CODE = `import { useIncidents } from "@alertforge/react";
import { IncidentFeed } from "@alertforge/react-ui";

function IncidentDashboard() {
  const { incidents } = useIncidents();

  return (
    <>
      {incidents.map((incident) => (
        <IncidentFeed
          key={incident.id}
          incident={incident}
          className="incident"
        />
      ))}
    </>
  );
}`;

function CodeShowcase() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full bg-[#0a0a0a] py-24 px-6 md:px-10 lg:px-16 lg:py-40 flex items-center justify-center">
      <div className="w-full max-w-3xl min-w-0">

        {/* Top text */}
        <h2 className="text-white text-lg md:text-xl font-[geist-semibold] mb-3 tracking-tight">
          First-class developer experience.
        </h2>
        <p className="text-zinc-400 text-sm md:text-base font-[geist-regular] leading-relaxed mb-6 max-w-xl">
          Every API is carefully crafted to provide{" "}
          <span className="text-white font-semibold">
            the best developer experience
          </span>
          . Avoid hiring and ship faster with our{" "}
          <span className="text-white font-semibold">
            pre-built SDKs
          </span>
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mb-10 font-[geist-regular]">
          <a
            className="text-sm px-5 py-2 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-all duration-200"
          >
            Read the docs
          </a>
          <a
            className="text-sm px-5 py-2 text-zinc-300 hover:text-white font-medium transition-all duration-200 flex items-center gap-1"
          >
            Browse examples →
          </a>
        </div>

        {/* Code block */}
        <div className="relative rounded-xl border border-zinc-800/60 bg-zinc-950 overflow-x-auto">

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all duration-200"
          >
            {copied
              ? <Check size={15} className="text-green-400" />
              : <Copy size={15} />
            }
          </button>

          <SyntaxHighlighter
            language="jsx"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              background: "transparent",
              fontSize: "0.8rem",
              lineHeight: "1.7",
            }}
            showLineNumbers={true}
            lineNumberStyle={{
              color: "#3f3f46",
              minWidth: "2.5rem",
              paddingRight: "1rem",
              userSelect: "none",
            }}
          >
            {CODE}
          </SyntaxHighlighter>
        </div>

      </div>
    </section>
  );
}

export default CodeShowcase;