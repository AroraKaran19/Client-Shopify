import React from "react";

const CloseNormalIcon = ({
  className,
  style,
  onClick,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      className={className}
      style={style}
      onClick={onClick}
    >
      <path
        fillRule="evenodd"
        d="M2.185 2.185a.625.625 0 0 1 .884 0l2.931 2.931 2.931-2.931a.625.625 0 1 1 .884.884l-2.931 2.931 2.933 2.933a.625.625 0 1 1-.884.884l-2.933-2.933-2.933 2.933a.625.625 0 0 1-.884-.884l2.933-2.933-2.931-2.931a.625.625 0 0 1 0-.884"
      ></path>
    </svg>
  );
};

export default CloseNormalIcon;
