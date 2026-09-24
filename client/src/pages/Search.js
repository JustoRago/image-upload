import { searchImages } from "../redux/search/searchSlice";
import { useDispatch, useSelector } from "react-redux";
import { mainClass, h1Class, pClass, imageUrl } from "../constants";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const Search = () => {
  const dispatch = useDispatch()
  const search = useLocation().search;
  const query = new URLSearchParams(search).get("query")
  const storedImages = useSelector((state) => state.searchReducer.images ?? [])
  // Without a query there are no results to show, even if the store still
  // holds a previous search.
  const images = query ? storedImages : []

  useEffect(() => {
    if (!query) return;
    dispatch(searchImages(query))
  }, [dispatch, query])

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Results for: {query}</h1>
      <div className="flex flex-col gap-2 items-center">
        {
          images.length ?
            images.map((image) => (
              <div className="flex items-center border-2 border-white rounded-md" key={image.id}>
                <p className={pClass}>{image.img_name}</p>
                <p className={pClass}>{image.created_at}</p>
                {image.filepath && <img className="w-full rounded-sm" alt='' src={imageUrl(image.filepath)} />}
              </div>
            )) :
            <p className={pClass}>
              No results found
            </p>
        }
      </div>
    </main>
  )
}

export default Search;