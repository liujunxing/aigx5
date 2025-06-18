import { useMessageWarehouse } from "@renderer/store/MessageWarehouseProvider";
import { useAtomValue } from "jotai";
import "./step-detail.css";

function get_step_detail(step: any) { 
  const str = String(step) ?? '...';
  if (str.length > 180)
    return str.substring(0, 180) + ' ...';
  return str;
}

export function StepDetail() {
  const aiStore = useMessageWarehouse();
  const steps = useAtomValue(aiStore.steps);
  
  return (
    <>
      <h2>Tool 调用详细步骤/信息</h2>
      <div className="step-detail">
        {steps.map((step, index) => (<div key={index}>{get_step_detail(step)}</div>))}
      </div>
    </>
  );
}
