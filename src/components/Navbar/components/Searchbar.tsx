import { useEffect, useRef, useState } from "react";
import SearchIcon from "../../../assets/svg/SearchIcon";
import FilterIcon from "../../../assets/svg/FilterIcon";
import CloseIcon from "../../../assets/svg/CloseIcon";
import FilterTag from "./FilterTag";
import LoadingIcon from "../../../assets/LoadingIcon";

const Searchbar = () => {
  const [search, setSearch] = useState<string>("");
  const searchBar = useRef<HTMLInputElement>(null);
  const [searchBoxFocused, setSearchBoxFocused] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<boolean>(false);
  const [filterList, setFilterList] = useState<object>({});
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const searchFilters = [
    "Apps",
    "Articles",
    "Blogs",
    "Collections",
    "Companies",
    "Customers",
    "Draft Orders",
    "Orders",
    "Pages",
    "Products",
    "Sales Channels",
    "Settings",
  ];

  useEffect(() => {
    if (searchBoxFocused) {
      searchBar.current?.focus();
    }
  }, [searchBoxFocused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setFilterMode(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (search.split(" ").slice(-1)[0] === "/") {
      setFilterMode(true);
    }
    if (search.length === 0 && searchBar.current) {
      setFilterMode(false);
      setSearching(false);
    }
  }, [search]);

  useEffect(() => {
    const handleSearchboxClick = (e: MouseEvent) => {
      if (
        (e.target instanceof Element &&
          e.target.closest(".search-bar-wrapper")) ||
        (searchBar.current && searchBar.current === document.activeElement)
      ) {
        setSearchBoxFocused(true);
      } else {
        setSearchBoxFocused(false);
        setSearch("");
        setFilterMode(false);
        setSelectedFilter("");
        setSearching(false);
      }
    };

    document.addEventListener("click", handleSearchboxClick);

    return () => {
      document.removeEventListener("click", handleSearchboxClick);
    };
  }, []);

  useEffect(() => {
    if (filterMode) {
      setFilterList(
        searchFilters.filter(
          (filter) =>
            filter
              .toLowerCase()
              .includes(search.replace("/", "").toLowerCase()) &&
            selectedFilter.includes(filter) === false
        )
      );
      searchBar.current?.focus();
    }

    if (search.length > 0) {
      setSearching(true);
      const handleSearching = setTimeout(() => {
        setSearching(false);
      }, 2000);
      return () => clearTimeout(handleSearching);
    }
  }, [search]);

  useEffect(() => {
    const handleBackspace = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        if (search.length === 0) {
          if (selectedFilter.length > 0) {
            removeFilter();
          } else {
            setFilterMode(false);
          }
        }
      }
    };
    document.addEventListener("keydown", handleBackspace);

    return () => {
      document.removeEventListener("keydown", handleBackspace);
    };
  }, [selectedFilter, search]);

  const removeFilter = () => {
    setSelectedFilter("");
    searchBar.current?.focus();
  };

  useEffect(() => {
    console.log(selectedFilter);
  }, [selectedFilter]);

  return (
    <div
      className={`search-bar-wrapper rounded-xl flex items-center justify-center w-1/3 flex-shrink h-[38px] relative sm:static overflow-y-visible sm:flex-1 ${
        searchBoxFocused ? "p-2" : ""
      }`}
    >
      <div
        className={`search-bar-container w-full lg:w-[calc(100vw/2)] md:w-[calc(100vw/2)] sm:w-screen rounded-xl flex flex-col gap-3 ${
          searchBoxFocused
            ? "bg-white p-3 top-[-0.4rem] left-0 lg:left-1/2 lg:-translate-x-1/2 md:left-1/2 md:-translate-x-1/2 absolute border-[1px] border-black/30 drop-shadow-2xl z-[1000]"
            : ""
        }`}
      >
        <div
          className={`search-bar w-full flex items-center gap-1.5 px-3 border-[1px] cursor-pointer relative ${
            searchBoxFocused
              ? "bg-white border-black text-black rounded-lg"
              : "text-white/60 bg-[#303030] hover:bg-transparent border-white/20 rounded-xl"
          }`}
        >
          <div className="icon flex items-center justify-center h-full flex-shrink-0">
            {searching ? (
              <LoadingIcon className="size-4" />
            ) : (
              <SearchIcon className="size-4 my-[0.35rem]" />
            )}
          </div>
          {selectedFilter && (
            <FilterTag filter={selectedFilter} onClick={removeFilter} />
          )}
          <input
            type="text"
            placeholder="Search"
            className={`h-full w-full outline-none bg-transparent truncate text-[14px] my-[0.35rem] ${
              searchBoxFocused
                ? "cursor-text placeholder:text-black/60"
                : "cursor-pointer placeholder:text-white/60"
            }`}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            maxLength={2000}
            aria-label="Search"
            ref={searchBar}
          />
          <div className="button-overlay-placeholder flex gap-1.5 items-center h-full">
            {searchBoxFocused ? (
              <>
                <CloseIcon
                  className={`size-4 ${
                    search.length > 0 || selectedFilter.length > 0
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                  onClick={() => {
                    setSearch("");
                    removeFilter();
                  }}
                />
                <FilterIcon
                  className="size-4 fill-black/60 hover:fill-black/80"
                  mode={filterMode}
                  onClick={() => {
                    search.split(" ").slice(-1)[0] != "/"
                      ? setSearch(search + (search.length > 0 ? " " : "") + "/")
                      : setSearch(search.replace(/\/.*/, ""));
                  }}
                />
              </>
            ) : (
              <>
                <div className="search-overlay-button tracking-wider font-semibold">CTRL</div>
                <div className="search-overlay-button tracking-wider font-semibold">K</div>
              </>
            )}
          </div>
        </div>
        {/* Contents of Searchbar when it's selected */}
        {searchBoxFocused && (
          <div className="content w-full min-h-[225px] max-h-[800px] overflow-y-auto overflow-x-hidden">
            {filterMode ? (
              <div className="filter-Screen flex flex-col gap-0.5">
                <div className="filters flex flex-col gap-0.5">
                  {search.split(" ").slice(-1)[0] === "/" ? (
                    <>
                      <div className="filterby-title">Filter by</div>
                      {searchFilters.map((filter, index) => {
                        if (!selectedFilter.includes(filter)) {
                          return (
                            <div
                              key={index}
                              className="filter px-1 py-[0.35rem]"
                              onClick={() => {
                                setSelectedFilter(filter);
                                setSearch(
                                  search.toLowerCase().replace(/\/.*/, "")
                                );
                                searchBar.current?.focus();
                              }}
                            >
                              <span>{filter}</span>
                            </div>
                          );
                        }
                      })}
                    </>
                  ) : filterList && Object.keys(filterList).length > 0 ? (
                    <>
                      <div className="filterby-title">Filter by</div>
                      {Object.values(filterList).map((filter, index) => (
                        <div
                          key={index}
                          className="filter px-1 py-[0.35rem]"
                          onClick={() => {
                            setSelectedFilter(filter);
                            setSearch(
                              search
                                .toLowerCase()
                                .replace(`/${filter.toLowerCase()}`, "")
                            );
                            searchBar.current?.focus();
                          }}
                        >
                          <span>{filter}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="search-filter h-[200px] flex items-center justify-center">
                      {searching ? (
                        <LoadingIcon className="size-10" />
                      ) : (
                        <p>No filters found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // This is the default search screen
              <div className="search-Screen h-[200px]">
                {selectedFilter.length === 0 && (
                  <div className="default-filters-list flex items-center gap-2 h-fit">
                    {searchFilters.map((filter, index) => {
                      if (!selectedFilter.includes(filter) && index < 5) {
                        return (
                          <div
                            key={index}
                            className="filter"
                            onClick={() => {
                              searchBar.current?.focus();
                              setSelectedFilter(filter);
                              setSearch("");
                            }}
                          >
                            <span>{filter}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {search.length > 0 ? (
                  <div className="searching h-full flex items-center justify-center">
                    {searching ? (
                      <LoadingIcon className="size-10" />
                    ) : (
                      <p>Nothing Found!</p>
                    )}
                  </div>
                ) : (
                  <div className="default-screen h-full flex flex-col items-center justify-center gap-2">
                    <SearchIcon className="size-12 !stroke-[1.5] text-black/50" />
                    <p>Find anything in My Store</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Searchbar;
