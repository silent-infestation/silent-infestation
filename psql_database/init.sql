CREATE DATABASE prod_silen2festation;
CREATE DATABASE dev_silen2festation;
CREATE DATABASE test_silen2festation;

GRANT pg_read_all_data TO pascal_parasite;
GRANT pg_write_all_data TO pascal_parasite;

GRANT ALL ON DATABASE dev_silen2festation TO pascal_parasite;
ALTER DATABASE dev_silen2festation OWNER TO pascal_parasite;
GRANT ALL PRIVILEGES ON DATABASE dev_silen2festation TO pascal_parasite;

GRANT ALL ON DATABASE prod_silen2festation TO pascal_parasite;
ALTER DATABASE prod_silen2festation OWNER TO pascal_parasite;
GRANT ALL PRIVILEGES ON DATABASE prod_silen2festation TO pascal_parasite;

GRANT ALL ON DATABASE test_silen2festation TO pascal_parasite;
ALTER DATABASE test_silen2festation OWNER TO pascal_parasite;
GRANT ALL PRIVILEGES ON DATABASE test_silen2festation TO pascal_parasite;