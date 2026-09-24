import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getImages } from '../redux/images/imagesSlice';
import { mainClass, h1Class, pClass, imageUrl } from '../constants';

const Main = () => {
  const image = useSelector((state) => state.imagesReducer.images?.[0] ?? null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getImages('random=true'))
  }, [dispatch])

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>See images here</h1>
      {image?.filepath ? (
        <img
          className="max-w-36"
          src={imageUrl(image.filepath)}
          alt=""
        />
      ) : null}
      {image?.img_name ? <p className={pClass}>{image.img_name}</p> : null}
    </main>
  )
}

export default Main;