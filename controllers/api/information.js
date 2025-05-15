import Information from "../../models/information.js";

export const get_information = async (req, res) => {
    try {
      const infoList = await Information.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "username")
        .limit(1)
        .lean();
  
      res.status(200).json({
        success: true,
        data: infoList[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch information.",
      });
    }
  };
  