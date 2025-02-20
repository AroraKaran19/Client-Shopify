import CalendarCell from "./CalendarCell";

const EmptyCells = ({ emptyCells }: { emptyCells: number }) => {
  return (
    <>
      {Array.from({ length: emptyCells }).map((_, index) => (
        <CalendarCell key={index} className="empty-cell"></CalendarCell>
      ))}
    </>
  );
};

export default EmptyCells;
