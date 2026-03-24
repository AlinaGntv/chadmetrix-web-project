from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import os

from database import get_db
from models.models import Analysis, Photo, User

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_file(file: UploadFile):
    ext = file.filename.split(".")[-1]
    name = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, name)

    with open(path, "wb") as f:
        f.write(file.file.read())

    return path


@router.post("")
async def create_analysis(
    photo_front: UploadFile = File(...),
    photo_side: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    # пока без auth, потом добавим

    front_path = save_file(photo_front)

    side_path = None
    if photo_side:
        side_path = save_file(photo_side)

    analysis = Analysis(
        id=str(uuid.uuid4()),
    )

    db.add(analysis)
    db.commit()

    photo1 = Photo(
        id=str(uuid.uuid4()),
        analysis_id=analysis.id,
        path=front_path,
    )

    db.add(photo1)

    if side_path:
        photo2 = Photo(
            id=str(uuid.uuid4()),
            analysis_id=analysis.id,
            path=side_path,
        )
        db.add(photo2)

    db.commit()

    return {"analysis_id": analysis.id}