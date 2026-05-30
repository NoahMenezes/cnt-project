import type { SVGAttributes } from "react";

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="180"
        height="40"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="#030712"
          className="dark:fill-[#FFFFFF]"
        />
        <path
          d="M20 12v16M12 20h16"
          stroke="white"
          className="dark:stroke-[#030712]"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text 
          x="44" 
          y="26" 
          fontSize="18" 
          fontWeight="bold" 
          fontFamily="system-ui, sans-serif" 
          fill="#030712" 
          className="dark:fill-[#FFFFFF]"
          letterSpacing="-0.5"
        >
          CipherScope
        </text>
      </svg>
    </div>
  );
};

export default Logo;
