import Information from "../../models/information.js";

export const get_information = async (req, res) => {
  try {
    const lastPublished = await Information.findOne({ status: "published" })
      .sort({ createdAt: -1 })
      .exec();

    console.log(lastPublished, lastPublished?.title);

    if (!lastPublished) {
      return res.render("general_information", {
        info: {
          title: "No published information found.",
        },
      });
    }

    res.render("general_information", { info: lastPublished, title: 
        'information'
     });
  } catch (error) {
    console.error("Error fetching last published info:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};
