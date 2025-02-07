const LoadingIcon = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      className={`loading_loader rounded-full ` + className}
      style={style}
    ></div>
  );
};

export default LoadingIcon;
