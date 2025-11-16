import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-overlays.css";

export default function ProcessDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  const processInstance = location.state?.processInstance;
  const passedVars = location.state?.variables || [];

  const [vars] = useState(passedVars);
  const [diagramXml, setDiagramXml] = useState("");
  const [diagramError, setDiagramError] = useState("");

  const diagramRef = useRef(null);
  const bpmnViewerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    if (!processInstance) {
      setDiagramError(
        "No process instance data available /n Keine Daten zur Prozessinstanz verfügbar"
      );
      return;
    }

    setDiagramError("");

    api
      .get(
        `/process-instances/${processInstance.processDefinitionKey}/diagram.xml`,
        {
          responseType: "text",
          headers: { Accept: "application/xml,text/xml" },
        }
      )
      .then((res) => {
        const xml =
          typeof res.data === "string"
            ? res.data
            : new XMLSerializer().serializeToString(res.data);

        if (xml && xml.includes("<bpmn:")) {
          setDiagramXml(xml);
        } else {
          setDiagramError(
            "Invalid BPMN XML received /n Ungültige BPMN-XML empfangen"
          );
        }
      })
      .catch(() =>
        setDiagramError(
          "Failed to load process diagram /n Fehler beim Laden des Prozessdiagramms"
        )
      );
  }, [processInstance]);

  useEffect(() => {
    if (!diagramXml || !diagramRef.current) return;
    if (bpmnViewerRef.current) {
      bpmnViewerRef.current.destroy();
      bpmnViewerRef.current = null;
    }

    const viewer = new NavigatedViewer({ container: diagramRef.current });
    bpmnViewerRef.current = viewer;

    viewer
      .importXML(diagramXml)
      .then(async() => {
        const canvas = viewer.get("canvas");
        canvas.zoom("fit-viewport");
      //  if (canvas.resized) canvas.resized();
        try {   
          const statsRes=await api.get(`/process-instances/${processInstance.key}/statistics`);
          const stats = statsRes.data;
          
          stats.forEach(stat => {
            if (stat.active> 0) {
              canvas.addMarker(stat.activityId, "highlight-active");
            }else if (stat.completed > 0) {
              canvas.addMarker(stat.activityId, "highlight-completed");
            }else if (stat.canceled > 0) {
              canvas.addMarker(stat.activityId, ".highlight-canceled");
            }
            else if (stat.incidents > 0) {
              canvas.addMarker(stat.activityId, "highlight-incident");
            }
            
          });
          
          const nodesRes=await api.get(`/process-instances/${processInstance.key}`);
          nodesRes.data.items.forEach(node => {
            if (node.state === "COMPLETED") {
              canvas.addMarker(node.flowNodeId, "highlight-completed");
            }
            else if (node.state === "ACTIVE") {
              canvas.addMarker(node.flowNodeId, "highlight-active");  

            }
            else if (node.state === "CANCELED") {
              canvas.addMarker(node.flowNodeId, "highlight-canceled");  
            }
            else if (node.incidents) {
              canvas.addMarker(node.flowNodeId, "highlight-incident");  
            }
          });
          const flowsRes= await api.get(`/process-instances/${processInstance.key}/sequence-flows`);
          flowsRes.data.forEach(flow => {
          
              canvas.addMarker(flow, "highlight-flow");
            
          }
          );
        } catch(err) {
          console.error("Error fetching process statistics:", err);
        }  
      })
      .catch((err) => {
        console.error("BPMN import error:", err);
        setDiagramError(
          "Failed to render BPMN diagram / BPMN-Diagramm konnte nicht gerendert werden: " +
            err.message
        );
      });

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    resizeObserverRef.current = new ResizeObserver(() => {
      if (!bpmnViewerRef.current) return;
      const canvas = bpmnViewerRef.current.get("canvas");
      if (canvas.resized) canvas.resized();

      try {
        canvas.zoom("fit-viewport");
      } catch {}
    });
    resizeObserverRef.current.observe(diagramRef.current);
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (bpmnViewerRef.current) {
        bpmnViewerRef.current.destroy();
        bpmnViewerRef.current = null;
      }
    };
  }, [diagramXml]);

  if (!processInstance) {
    return (
      <div style={{ padding: 16, color: "crimson" }}>
        No process instance data available /n Keine Daten zur Prozessinstanz verfügbar
      </div>
    );
  }

  return (
    <div style={layoutWrap}>
      {/* Left card: Variables */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Card>
          <div style={cardHeader}>
            <button style={backBtn} onClick={() => navigate("/dashboard")}>
              <span style={{ fontSize: 18 }}>←</span> Back to Dashboard / <br /> Zurück zum Dashboard
            </button>
            <h2 style={title}>Requests / Anfragen</h2>
          </div>

          <div style={{ overflow: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Name / Name</th>
                  <th style={th}>Value / Wert</th>
                </tr>
              </thead>
              <tbody>
                {vars.map((v, idx) => (
                  <tr key={v.key ?? v.name ?? idx}>
                    <td style={td}>{v.name}</td>
                    <td style={td}>
                      {typeof v.value === "object"
                        ? JSON.stringify(v.value)
                        : String(v.value)}
                    </td>
                  </tr>
                ))}
                {vars.length === 0 && (
                  <tr>
                    <td style={td} colSpan={2}>
                      — No variables — / — Keine Variablen —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right card: BPMN Diagram */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Card>
          <h2 style={title}>BPMN Diagram / BPMN-Diagramm</h2>
          <div style={diagramOuter}>
            <div ref={diagramRef} style={diagramInner} />
          </div>

          {diagramError && <div style={{ color: "crimson" }}>{diagramError}</div>}
        </Card>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eaeaea",
        borderRadius: 10,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

const layoutWrap = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
  height: "calc(100vh - 64px)",
  padding: 16,
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const backBtn = {
  background: "#e6f0ff",
  border: "none",
  color: "#111",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const title = { margin: 0 };

const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: "8px" };
const td = { borderBottom: "1px solid #f2f2f2", padding: "8px" };

const diagramOuter = {
  width: "100%",
  height: 600,
  background: "#f8f8f8",
  border: "1px solid #eee",
  borderRadius: 6,
  overflow: "hidden",
};

const diagramInner = {
  width: "100%",
  height: "100%",
  background: "#fff",
};
