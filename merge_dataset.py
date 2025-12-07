import pandas as pd

fake = pd.read_csv("data/Fake.csv")
true = pd.read_csv("data/True.csv")

fake["label"] = "FAKE"
true["label"] = "REAL"

df = pd.concat([fake, true], ignore_index=True)
df = df.sample(frac=1, random_state=42)  
df = df[["text", "label"]]

df.to_csv("data/train.csv", index=False)
print("Dataset merged successfully → data/train.csv created!")





























































