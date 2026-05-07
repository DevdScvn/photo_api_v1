# hono_example

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.js
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


# Подключиться                                                                                                                                                                                                                                                                                                      docker exec -it photo_api_v1-mongodb-1 mongosh

# Основные команды внутри mongosh
show dbs                        # список баз
use photographer                # переключиться на базу
show collections                # список коллекций
db.posts.find().pretty()        # все документы
db.posts.find({ authorId: "john_doe" })
db.posts.countDocuments()
db.posts.deleteOne({ _id: ObjectId("...") })
db.posts.drop()                 # удалить коллекцию

  ---
GUI-клиенты

