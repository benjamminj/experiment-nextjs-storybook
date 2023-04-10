import { ReactNode } from "react";

function Button({ children }: { children: ReactNode }) {
  return <button className="bg-red-500 px-3 py-2">{children}</button>;
}

export default Button;
