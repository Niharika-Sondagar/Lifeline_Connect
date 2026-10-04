import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Hospital,
  CheckCheck,
  XCircle,
} from "lucide-react";

const STAGES = [
  { key: "pending", label: "SOS Sent", icon: Clock },
  { key: "accepted", label: "Hospital Accepted", icon: Hospital },
  { key: "ambulance_assigned", label: "Ambulance Assigned", icon: Truck },
  { key: "on_the_way", label: "En Route", icon: Truck },
  { key: "reached_patient", label: "At Location", icon: MapPin },
  { key: "completed", label: "Completed", icon: CheckCheck },
]; // list of possible emergency stages

export default function EmergencyStatusTracker({ status }) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div
        className="tracker-container"
        style={{
          background: "#fef2f2",
          borderColor: "#fecaca",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <XCircle size={32} color="#dc2626" />
        <div>
          <h4 style={{ margin: 0, color: "#991b1b", fontSize: "1.1rem" }}>
            Emergency Request{" "}
            {status === "cancelled" ? "Cancelled" : "Declined"}
          </h4>
          <p
            style={{
              margin: "0.25rem 0 0",
              color: "#b91c1c",
              fontSize: "0.9rem",
            }}
          >
            {status === "cancelled"
              ? "This emergency request was cancelled."
              : "The requested medical center was unavailable. Please retry or contact emergency hotline 112."}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === status); // get index for status 
  const activeStep = currentIndex === -1 ? 0 : currentIndex; // active step = if status not found, default to 0 (pending), else use current index
  const progressPercent = (activeStep / (STAGES.length - 1)) * 100;

  return (
    <div className="tracker-container">
      <div className="tracker-steps">
        <div className="tracker-connector">
          <div
            className="tracker-connector-progress"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {STAGES.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;

          let stepClass = "tracker-step";
          if (isCompleted) stepClass += " completed";
          if (isActive) stepClass += " active";

          return (
            <div key={step.key} className={stepClass}>
              <div className="step-bubble">
                {isCompleted ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <StepIcon size={18} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
