import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { getImages } from '../redux/images/imagesSlice';
import { mainClass, h1Class, pClass, imageUrl } from '../constants';

const Main = () => {
  const [image, setImage] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const load = async () => {
      const randomImage = await dispatch(getImages('random=true'))
      if (randomImage.payload?.body?.[0]) {
        setImage(randomImage.payload.body[0])
      }
    }
    load()
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