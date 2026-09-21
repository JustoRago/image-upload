import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { getImages } from '../redux/images/imagesSlice';
import { mainClass, pClass, imageUrl } from '../constants';
import { useParams } from 'react-router-dom';

const Image = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { id } = useParams()

  useEffect(() => {
    let active = true;

    const getImage = async () => {
      setLoading(true)
      const result = await dispatch(getImages(`id=${id}`))

      if (active && result.payload?.body?.[0]) {
        setImage(result.payload.body[0]);
      }
      if (active) {
        setLoading(false);
      }
    };

    if (id) {
      getImage();
    }
    return () => {
      active = false;
    }
  }, [id, dispatch]);

  if (loading) {
    return <main className={mainClass}>Loading...</main>;
  }

  if (!image) {
    return <main className={mainClass}>Image not found</main>;
  }

  return (
    <main className={mainClass}>
      {image.filepath && (
        <img
          className="max-w-36"
          src={imageUrl(image.filepath)}
          alt=""
        />
      )}
      <p className={pClass}>{image.img_name}</p>
    </main>
  )
}

export default Image;