import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";

const countAtom = atom(0);

export default function TestJotai() {
  const [count, setCount] = useAtom(countAtom);

  const increase = () => { 
    setCount(_ => _ + 1);
  };
  const decrease = () => { 
    setCount(count - 1);
  };

  return (
    <div>
      <h1>TestJotai</h1>
      <div>
        Count: {count};
      </div>
      <div>
        <button className="reset-button" onClick={increase}>Increase</button>
        <button className="reset-button" onClick={decrease}>Decrease</button>
      </div>
      <Inner1 />
      <Inner2 />
    </div>
  );
}

function Inner1() {
  const count = useAtomValue(countAtom);

  return (
    <div>
      Inner1: {count}
    </div>
  )
}

function Inner2() {
  const setCount = useSetAtom(countAtom);
  const setter = useMemo(() => {
    return {
      inc: () => { setCount(_ => _ + 1) },
      dec: () => { setCount(_ => _ - 1) },
    }
  }, [setCount]);

  return (
    <div>
      Inner2:
      <button className="reset-button" onClick={setter.inc}>INC</button> &nbsp;
      <button className="reset-button" onClick={setter.dec}>DEC</button>
    </div>
  )
}
