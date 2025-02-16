
// Get all users
export const getUsers = async (req, res) => {
    try {
      res.render("index", { title: "Home Page" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  


// Get all users (Render View)
// exports.getUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.render("users", { users });
//   } catch (error) {
//     res.status(500).send("Error fetching users");
//   }
// };


// // Get a single user by ID
// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Create a new user
// exports.createUser = async (req, res) => {
//   try {
//     const newUser = new User(req.body);
//     await newUser.save();
//     res.status(201).json(newUser);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Update a user
// exports.updateUser = async (req, res) => {
//   try {
//     const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updatedUser);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Delete a user
// exports.deleteUser = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     res.json({ message: "User deleted" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


  
