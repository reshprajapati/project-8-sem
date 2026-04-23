const Design = require('../db/Design');
const User = require('../db/User');

const populateDesigner = async (designerId) => {
  const designer = await User.findById(designerId);
  if (!designer) return null;

  return {
    _id: designer._id,
    name: designer.name,
    email: designer.email,
    profileImage: designer.profileImage,
    specialization: designer.specialization,
    experience: designer.experience
  };
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return value === 'true';
};

const parseMaterials = (materials) => {
  if (materials === undefined) {
    return undefined;
  }

  if (Array.isArray(materials)) {
    return materials.filter(Boolean);
  }

  if (typeof materials === 'string') {
    return materials
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildDesignPayload = (data, options = {}) => {
  const { partial = false } = options;
  const payload = {};

  if (!partial || data.title !== undefined) payload.title = data.title;
  if (!partial || data.description !== undefined) payload.description = data.description;
  if (!partial || data.surfaceType !== undefined) payload.surfaceType = data.surfaceType;
  if (data.category !== undefined) payload.category = data.category;
  if (data.materials !== undefined) payload.materials = parseMaterials(data.materials);
  if (data.cost !== undefined) payload.cost = Number(data.cost) || 0;
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.appointmentId !== undefined) payload.appointmentId = data.appointmentId;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (!partial || data.isPortfolio !== undefined) {
    payload.isPortfolio = normalizeBoolean(data.isPortfolio, true);
  }

  return payload;
};

const populateDesigns = async (designs) => {
  return Promise.all(designs.map(async (design) => {
    const designerData = await populateDesigner(design.designerId);
    return {
      ...design,
      designerId: designerData
    };
  }));
};

// Create/Upload design
exports.createDesign = async (req, res) => {
  try {
    const { title, description, surfaceType } = req.body;

    if (!title || !description || !surfaceType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and surface type'
      });
    }

    const design = await Design.create({
      designerId: req.userId,
      ...buildDesignPayload(req.body)
    });

    res.status(201).json({
      success: true,
      message: 'Design created successfully',
      design
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all public designs
exports.getDesigns = async (req, res) => {
  try {
    const { category, surfaceType, designerId } = req.query;
    const query = { isPortfolio: true };

    if (category) query.category = category;
    if (surfaceType) query.surfaceType = surfaceType;
    if (designerId) query.designerId = designerId;

    const designs = await Design.find(query);
    const populatedDesigns = await populateDesigns(designs);

    populatedDesigns.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      count: populatedDesigns.length,
      designs: populatedDesigns
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get a designer's public designs
exports.getDesignerDesigns = async (req, res) => {
  try {
    const designs = await Design.find({
      designerId: req.params.designerId,
      isPortfolio: true
    });

    designs.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      count: designs.length,
      designs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all designs for the logged in designer
exports.getMyDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ designerId: req.userId });

    designs.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      count: designs.length,
      designs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get single design
exports.getDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design || !design.isPortfolio) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const designerData = await populateDesigner(design.designerId);

    res.status(200).json({
      success: true,
      design: {
        ...design,
        designerId: designerData
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update design
exports.updateDesign = async (req, res) => {
  try {
    let design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    if (design.designerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this design'
      });
    }

    design = await Design.findByIdAndUpdate(
      req.params.id,
      buildDesignPayload(req.body, { partial: true })
    );

    res.status(200).json({
      success: true,
      message: 'Design updated successfully',
      design
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete design
exports.deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    if (design.designerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this design'
      });
    }

    await Design.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Design deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Add review to design
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    let design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    design = await Design.findByIdAndUpdate(req.params.id, {
      clientReview: {
        rating,
        comment,
        reviewedBy: req.userId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      design
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
