'use strict';


const { ObjectId } = require('mongodb');
const {
  findAllKitchenOrders,
  findOrdersByStatus,
  findKitchenOrderById,
  updateOrderStatus,
} = require('../repositories/kitchenRepository');


const STATUS_LIFECYCLE = ['Pending', 'Preparing', 'Ready', 'Served'];

const VALID_INPUT_STATUSES = ['pending', 'preparing', 'ready', 'completed'];

const STATUS_MAP = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Served',
  served:    'Served',
};


function isValidObjectId(id) {
  return (
    typeof id === 'string' &&
    ObjectId.isValid(id) &&
    String(new ObjectId(id)) === id
  );
}

function isValidTransition(currentStatus, newStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  const newIdx     = STATUS_LIFECYCLE.indexOf(newStatus);

  if (currentIdx === -1 || newIdx === -1) return false;

  return newIdx === currentIdx + 1;
}

function describeAllowedNext(currentStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  if (currentIdx === -1 || currentIdx === STATUS_LIFECYCLE.length - 1) {
    return null;
  }
  return STATUS_LIFECYCLE[currentIdx + 1];
}

function toUserFacingStatus(canonical) {
  if (canonical === 'Served') return 'completed';
  return canonical.toLowerCase();
}


async function getAllKitchenOrders(req, res) {
  try {
    const orders = await findAllKitchenOrders();

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getAllKitchenOrders] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch kitchen orders. Please try again.' });
  }
}


async function getKitchenOrdersByStatus(req, res) {
  try {
    const { status } = req.params;

    if (!status || String(status).trim() === '') {
      return res.status(400).json({
        error: 'status parameter is required.',
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    const canonicalStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!canonicalStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    const orders = await findOrdersByStatus(canonicalStatus);

    return res.status(200).json({
      status: canonicalStatus,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getKitchenOrdersByStatus] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders by status. Please try again.' });
  }
}


async function getKitchenOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    const order = await findKitchenOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error('[getKitchenOrderById] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch order. Please try again.' });
  }
}


async function updateKitchenOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    if (status === undefined || status === null || String(status).trim() === '') {
      return res.status(400).json({
        error: 'status is required in the request body.',
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    const normalisedStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!normalisedStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    const currentOrder = await findKitchenOrderById(id);

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (currentOrder.status === normalisedStatus) {
      return res.status(422).json({
        error: `Order is already in "${toUserFacingStatus(normalisedStatus)}" status.`,
        currentStatus: toUserFacingStatus(currentOrder.status),
      });
    }

    if (!isValidTransition(currentOrder.status, normalisedStatus)) {
      const allowedNextCanonical = describeAllowedNext(currentOrder.status);
      const isTerminal = currentOrder.status === STATUS_LIFECYCLE[STATUS_LIFECYCLE.length - 1];

      if (isTerminal) {
        return res.status(422).json({
          error: `Order is already completed and cannot be updated further.`,
          currentStatus: toUserFacingStatus(currentOrder.status),
        });
      }

      return res.status(422).json({
        error: `Invalid status transition: "${toUserFacingStatus(currentOrder.status)}" → "${toUserFacingStatus(normalisedStatus)}". Orders must advance one step at a time.`,
        currentStatus: toUserFacingStatus(currentOrder.status),
        allowedNextStatus: toUserFacingStatus(allowedNextCanonical),
      });
    }

    const updated = await updateOrderStatus(id, normalisedStatus);

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
    }

    return res.status(200).json({
      message: `Order status updated: "${toUserFacingStatus(currentOrder.status)}" → "${toUserFacingStatus(normalisedStatus)}".`,
      order: updated,
    });
  } catch (err) {
    console.error('[updateKitchenOrderStatus] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to update order status. Please try again.' });
  }
}

module.exports = {
  getAllKitchenOrders,
  getKitchenOrdersByStatus,
  getKitchenOrderById,
  updateKitchenOrderStatus,
};
