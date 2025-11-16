import { useEffect, useState } from "react";
import api from "../services/api";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { keycloak } = useKeycloak();
  const [processInstances, setProcessInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/process-instances?size=200");
        const data = res.data.items;

        const enrichedInstances = await Promise.all(
          data.map(async (pi) => {
            try {
              const varsRes = await api.get(
                `/process-instances/${pi.key}/variables`
              );
              const vars = varsRes.data.items;
              const projektIdVar = vars.find((v) => v.name === "projektId");
              return {
                ...pi,
                variables: vars,
                projektId: projektIdVar?.value || "N/A",
              };
            } catch {
              return { ...pi, projektId: "N/A" };
            }
          })
        );

        setProcessInstances(enrichedInstances);
      } catch (e) {
        setError(
          "Failed to load process instances / Fehler beim Laden der Prozessinstanzen"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div style={{ padding: 16 }}>Loading Requests… / Lade Anfragen…</div>
    );
  if (error)
    return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;

  const handleRowClick = (key) => {
    const processInstance = processInstances.find((pi) => pi.key === key);
    navigate(`/process/${key}`, {
      state: { processInstance, variables: processInstance.variables },
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Requests / Anfragen</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Project ID</th>
            <th style={th}>Prozessname</th>
            <th style={th}>State / Status</th>
            <th style={th}>Request Date / Anfragedatum</th>
          </tr>
        </thead>
        <tbody>
          {processInstances.map((pi) => (
            <tr
              key={pi.key}
              style={{ cursor: "pointer" }}
              onClick={() => handleRowClick(pi.key)}
              className="clickable-row"
            >
              <td style={td}>{pi.projektId}</td>
              <td style={td}>
                {pi.bpmnProcessId === "nutzungsplanungKommunal"
                  ? "Nutzungsplanung Kommunal"
                  : pi.bpmnProcessId}
              </td>
              <td style={td}>{pi.state}</td>
              <td style={td}>{pi.startDate?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "8px",
};
const td = { borderBottom: "1px solid #f2f2f2", padding: "8px" };
