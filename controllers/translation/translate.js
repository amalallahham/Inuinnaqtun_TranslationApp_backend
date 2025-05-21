
//Get method for /translate
export const get_translate = async (req, res) => {
  // Checking if user is admin for different nav bar
  if (!req.session || !req.session.adminId) {
    return res.render("translate", {
      error: "",
      title: "Translate",
      isAdmin: false,
      llmEnabled:  process.env.LLM_ENABLED === 'true',
    });
  }

  return res.render("translate", {
    error: "",
    title: "Translate",
    isAdmin: true,
    llmEnabled:  process.env.LLM_ENABLED === 'true',
  });
};
