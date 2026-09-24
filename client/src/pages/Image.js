import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getImages, deleteImage, updateImage } from '../redux/images/imagesSlice';
import { mainClass, pClass, imageUrl, inputClass, submitButtonClass, errorPClass } from '../constants';

const Image = () => {
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector((state) => state.sessionReducer.user);
  const image = useSelector((state) => state.imagesReducer.images?.[0] ?? null);

  useEffect(() => {
    let active = true;

    const getImage = async () => {
      setReady(false);
      await dispatch(getImages(`id=${id}`));
      if (active) {
        setReady(true);
      }
    };

    if (id) {
      getImage();
    }
    return () => {
      active = false;
    };
  }, [id, dispatch]);

  // Keep the rename field in sync with the stored image name.
  useEffect(() => {
    if (!editing && image?.img_name) {
      setNewName(image.img_name);
    }
  }, [image, editing]);

  const isOwner = Boolean(user && image && user.id === image.upload_id);

  const handleRename = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError('Image name cannot be empty');
      return;
    }
    const resp = await dispatch(updateImage({ id, img_name: name }));
    if (resp.payload?.status === 'success' && resp.payload?.body?.[0]) {
      setEditing(false);
      setError('');
    } else {
      setError(resp.payload?.message || 'Could not rename image');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this image permanently?')) return;
    const resp = await dispatch(deleteImage(id));
    if (resp.payload?.status === 'success') {
      navigate('/');
    } else {
      setError(resp.payload?.message || 'Could not delete image');
    }
  };

  if (!ready) {
    return <main className={mainClass}>Loading...</main>;
  }

  if (!image) {
    return <main className={mainClass}>Image not found</main>;
  }

  return (
    <main className={mainClass}>
      {image.filepath && (
        <img
          className="max-w-96"
          src={imageUrl(image.filepath)}
          alt={image.img_name}
        />
      )}

      {editing && isOwner ? (
        <form className="flex flex-col items-center gap-2" onSubmit={handleRename}>
          <input
            className={inputClass(false)}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-4">
            <button className={submitButtonClass} type="submit">Save</button>
            <button className={submitButtonClass} type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <p className={pClass}>{image.img_name}</p>
      )}

      <div className="text-white text-center">
        <p>
          Uploaded by <span className="font-bold">{image.uploader || `#${image.upload_id}`}</span>
          {image.category_name ? ` in ${image.category_name}` : ''}
        </p>
        <p className="text-gray-300 text-sm">Uploaded {image.created_at}</p>
        {image.updated_at && image.updated_at !== image.created_at && (
          <p className="text-gray-300 text-sm">Last updated {image.updated_at}</p>
        )}
      </div>

      {error && <p className={errorPClass}>{error}</p>}

      {isOwner && (
        <div className="flex gap-4">
          <button className={submitButtonClass} onClick={() => { setEditing(!editing); setError(''); }}>
            {editing ? 'Hide editor' : 'Rename'}
          </button>
          <button className={submitButtonClass} onClick={handleDelete}>Delete</button>
        </div>
      )}
    </main>
  )
}

export default Image;