import { useMessageWarehouse } from "@renderer/store/MessageWarehouseProvider";
import { useAtomValue } from "jotai";
import "./step-detail.css";

export function StepDetail() {
  const aiStore = useMessageWarehouse();
  const steps = useAtomValue(aiStore.steps);
  
  return (
    <>
      <h2>TOOL details</h2>
      <div className="step-detail">
        {steps.map((step, index) => (<div key={index}>{String(step)}</div>))}
      </div>
    </>
  );
}
