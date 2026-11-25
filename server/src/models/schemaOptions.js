export const applyStringIdSchema = (schema, { generateId, transform } = {}) => {
  schema.virtual("id")
    .get(function () {
      return this._id;
    })
    .set(function (value) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        this._id = String(value).trim();
      }
    });

  if (typeof generateId === "function") {
    schema.pre("validate", async function () {
      if (!this._id) {
        const generated = await generateId(this);
        if (generated) {
          this._id = generated;
        }
      }
    });
  }

  const serialize = (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return transform ? transform(ret) : ret;
  };

  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: serialize,
  });

  schema.set("toObject", {
    virtuals: true,
    versionKey: false,
    transform: serialize,
  });
};

export const normalizeDocIds = (docs) =>
  docs.map((doc) => {
    if (doc && !doc._id && doc.id) {
      const { id, ...rest } = doc;
      return { _id: id, ...rest };
    }
    return doc;
  });
