const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true
    },

    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message : "Email must be in valid format!"
        }
    },

    phone: {
        type : String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\+?\d{10,15}$/.test(v);
            },
            message : "Phone number must contain 10 to 15 digits."
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 8
    },

    role: {
        type: String,
        required: true,
        enum: ["Waiter", "Cashier", "Admin"]
    }
}, { timestamps : true })

userSchema.pre('save', async function () {
    if(!this.isModified('password')){
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

const RealUserModel = mongoose.model("User", userSchema);
const { userStore } = require("../config/inMemoryStore");

function UserWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new RealUserModel(data);
  }
  return {
    ...data,
    save: async () => {
      const created = await userStore.create(data);
      Object.assign(this, created);
      return created;
    },
    toObject: () => ({ ...data })
  };
}

UserWrapper.findOne = (query) => {
  if (mongoose.connection.readyState === 1) return RealUserModel.findOne(query);
  return userStore.findOne(query);
};

UserWrapper.findById = (id) => {
  if (mongoose.connection.readyState === 1) return RealUserModel.findById(id);
  return userStore.findById(id);
};

UserWrapper.find = () => {
  if (mongoose.connection.readyState === 1) return RealUserModel.find();
  const p = Promise.resolve(userStore.find());
  p.select = () => Promise.resolve(userStore.find());
  return p;
};

UserWrapper.create = (data) => {
  if (mongoose.connection.readyState === 1) return RealUserModel.create(data);
  return userStore.create(data);
};

module.exports = UserWrapper;