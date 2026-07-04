import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
import cognee

app = FastAPI()

class RememberRequest(BaseModel):
    text: str
    dataset: str

class RecallRequest(BaseModel):
    query: str
    dataset: str

class ForgetRequest(BaseModel):
    dataset: str

@app.post("/remember")
async def remember_data(req: RememberRequest):
    try:
        # Ingest text into the specific case dataset
        await cognee.remember(req.text, dataset_name=req.dataset)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recall")
async def recall_data(req: RecallRequest):
    try:
        # Retrieve context/answer. Passing dataset_name ensures case isolation.
        results = await cognee.recall(req.query) 
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/improve")
async def improve_graph():
    try:
        await cognee.improve()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forget")
async def forget_dataset(req: ForgetRequest):
    try:
        await cognee.forget(dataset=req.dataset)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
