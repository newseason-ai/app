"use client";

type PostScreenProps = {
  company: { name: string };
  onOptIn: () => void;
  onClose: () => void;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: 28, height: 28, color: "#1D9E75" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function PostScreen({ company, onOptIn, onClose }: PostScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#18181b",
        padding: "0 24px",
        paddingTop: "max(20px, env(safe-area-inset-top))",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 390,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#E1F5EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
            }}
          >
            <CheckIcon />
          </div>

          <h1
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -0.3,
            }}
          >
            Thanks for sharing
          </h1>

          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 16,
              color: "#52525B",
              lineHeight: 1.5,
            }}
          >
            Your feedback has been sent to the {company.name} team. It&apos;ll help
            shape what they build next.
          </p>

          <div style={{ height: 1, background: "#E4E4E7", marginTop: 16 }} />

          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#71717A",
              textTransform: "uppercase",
            }}
          >
            STAY IN THE LOOP
          </p>

          <div
            style={{
              background: "#EEEEE6",
              borderRadius: 16,
              padding: "16px 20px",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -0.4,
              }}
            >
              Want to be kept in the loop?
            </h2>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.5,
                color: "#3F3F46",
              }}
            >
              {company.name} will occasionally reach out when your input would be
              especially useful.
            </p>

            <button
              type="button"
              onClick={onOptIn}
              style={{
                width: "100%",
                borderRadius: 999,
                background: "#18181b",
                color: "#fff",
                border: "none",
                padding: "18px 28px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                WebkitAppearance: "none",
              }}
            >
              Yes, keep me in the loop
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#71717A",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.4,
              cursor: "pointer",
              padding: 0,
              textAlign: "center",
            }}
          >
            No thanks · close
          </button>
        </div>
      </div>
    </div>
  );
}
