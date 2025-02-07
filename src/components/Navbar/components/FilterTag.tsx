import CloseNormalIcon from "../../../assets/svg/CloseNormalIcon";

const FilterTag = ({ filter, onClick }: { filter?: string, onClick?: () => void }) => {
  return (
    <div className="filter-tag text-[12px] bg-black/10 text-black flex items-center gap-1 py-0.5 px-1.5 rounded-full">
      <span>{filter}</span>
			<CloseNormalIcon className="size-3 fill-black/50" onClick={onClick} />
    </div>
  );
};

export default FilterTag;
