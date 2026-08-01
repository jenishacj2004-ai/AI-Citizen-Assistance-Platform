from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "mysql+pymysql://root:mysqlroot@localhost/citizen_assistance_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
# Add this function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()