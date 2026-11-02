import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep this for development debugging.
    // Production console logging is disabled in index.js.
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#f8fafc",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "40px 32px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: "30px",
                fontWeight: "700",
              }}
            >
              !
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                fontSize: "24px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                margin: "0 0 24px",
                color: "#64748b",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              An unexpected error occurred while loading the application.
              Please reload the page and try again.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "13px",
                  textAlign: "left",
                  overflowX: "auto",
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "11px 22px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;