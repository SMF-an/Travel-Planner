const cloudbase = require('@cloudbase/node-sdk');

const tcb = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = tcb.database();
const _ = db.command;

async function ensureCollections() {
  const collections = ['travel_plans', 'locations', 'plan_locations'];
  for (const coll of collections) {
    try {
      await db.createCollection(coll);
      console.log(`Created collection: ${coll}`);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.log(`Collection ${coll} already exists or error: ${e.message}`);
      }
    }
  }
}

let collectionsInitialized = false;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://personal-d8ge1nis6551fced9-1428309492.tcloudbaseapp.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}

function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(data)
  };
}

function errorResponse(message, statusCode = 500) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message })
  };
}

async function getPlans() {
  try {
    const result = await db.collection('travel_plans').get();
    return result.data.map(plan => ({
      id: plan._id,
      title: plan.title,
      description: plan.description,
      start_date: plan.start_date,
      end_date: plan.end_date,
      budget_min: plan.budget_min,
      budget_max: plan.budget_max,
      num_people: plan.num_people,
      preferences: plan.preferences || [],
      start_location: plan.start_location,
      destination: plan.destination,
      status: plan.status || 'draft',
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }));
  } catch (e) {
    console.error('getPlans error:', e);
    return [];
  }
}

async function getPlanById(planId) {
  try {
    const result = await db.collection('travel_plans').doc(planId).get();
    if (result.data.length === 0) return null;
    const plan = result.data[0];
    return {
      id: plan._id,
      title: plan.title,
      description: plan.description,
      start_date: plan.start_date,
      end_date: plan.end_date,
      budget_min: plan.budget_min,
      budget_max: plan.budget_max,
      num_people: plan.num_people,
      preferences: plan.preferences || [],
      start_location: plan.start_location,
      destination: plan.destination,
      status: plan.status || 'draft',
      created_at: plan.created_at,
      updated_at: plan.updated_at
    };
  } catch (e) {
    console.error('getPlanById error:', e);
    return null;
  }
}

async function createPlan(planData) {
  try {
    const now = new Date().toISOString();
    const data = {
      title: planData.title,
      description: planData.description || null,
      start_date: planData.start_date,
      end_date: planData.end_date,
      budget_min: planData.budget_min,
      budget_max: planData.budget_max,
      num_people: planData.num_people,
      preferences: planData.preferences || [],
      start_location: planData.start_location,
      destination: planData.destination,
      status: planData.status || 'draft',
      created_at: now,
      updated_at: now
    };
    const result = await db.collection('travel_plans').add(data);
    return {
      id: result.id,
      ...data,
      created_at: now,
      updated_at: now
    };
  } catch (e) {
    console.error('createPlan error:', e);
    throw e;
  }
}

async function updatePlan(planId, updateData) {
  try {
    const now = new Date().toISOString();
    const updateFields = { updated_at: now };

    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.start_date !== undefined) updateFields.start_date = updateData.start_date;
    if (updateData.end_date !== undefined) updateFields.end_date = updateData.end_date;
    if (updateData.budget_min !== undefined) updateFields.budget_min = updateData.budget_min;
    if (updateData.budget_max !== undefined) updateFields.budget_max = updateData.budget_max;
    if (updateData.num_people !== undefined) updateFields.num_people = updateData.num_people;
    if (updateData.preferences !== undefined) updateFields.preferences = updateData.preferences;
    if (updateData.start_location !== undefined) updateFields.start_location = updateData.start_location;
    if (updateData.destination !== undefined) updateFields.destination = updateData.destination;
    if (updateData.status !== undefined) updateFields.status = updateData.status;

    await db.collection('travel_plans').doc(planId).update(updateFields);
    return await getPlanById(planId);
  } catch (e) {
    console.error('updatePlan error:', e);
    throw e;
  }
}

async function deletePlan(planId) {
  try {
    await db.collection('travel_plans').doc(planId).remove();
    return { message: '删除成功' };
  } catch (e) {
    console.error('deletePlan error:', e);
    throw e;
  }
}

async function getPlanLocations(planId) {
  try {
    const result = await db.collection('plan_locations')
      .where({ plan_id: planId })
      .orderBy('order_index', 'asc')
      .get();

    const locations = [];
    for (const pl of result.data) {
      const locResult = await db.collection('locations').doc(pl.location_id).get();
      if (locResult.data.length > 0) {
        const loc = locResult.data[0];
        locations.push({
          id: pl._id,
          plan_id: pl.plan_id,
          location: {
            id: loc._id,
            name: loc.name,
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
            description: loc.description,
            order_index: loc.order_index,
            created_at: loc.created_at
          },
          order_index: pl.order_index,
          visit_date: pl.visit_date,
          visit_time_slot: pl.visit_time_slot,
          notes: pl.notes,
          created_at: pl.created_at,
          updated_at: pl.updated_at
        });
      }
    }
    return locations;
  } catch (e) {
    console.error('getPlanLocations error:', e);
    return [];
  }
}

async function addLocationToPlan(planId, locationData) {
  try {
    const now = new Date().toISOString();

    const locResult = await db.collection('locations').add({
      name: locationData.name,
      address: locationData.address || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      description: locationData.description || '',
      order_index: 0,
      created_at: now
    });
    const locationId = locResult.id;

    const countResult = await db.collection('plan_locations')
      .where({ plan_id: planId })
      .count();
    const maxOrder = countResult.total || 0;

    const plResult = await db.collection('plan_locations').add({
      plan_id: planId,
      location_id: locationId,
      order_index: maxOrder,
      visit_date: locationData.visit_date || null,
      visit_time_slot: locationData.visit_time_slot || null,
      notes: locationData.notes || null,
      created_at: now,
      updated_at: now
    });

    return {
      id: plResult.id,
      plan_id: planId,
      location: {
        id: locationId,
        name: locationData.name,
        address: locationData.address || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        description: locationData.description || '',
        order_index: 0,
        created_at: now
      },
      order_index: maxOrder,
      visit_date: locationData.visit_date || null,
      visit_time_slot: locationData.visit_time_slot || null,
      notes: locationData.notes || null,
      created_at: now,
      updated_at: now
    };
  } catch (e) {
    console.error('addLocationToPlan error:', e);
    throw e;
  }
}

async function updatePlanLocation(planLocationId, updateData) {
  try {
    const now = new Date().toISOString();
    const updateFields = { updated_at: now };

    if (updateData.order_index !== undefined) updateFields.order_index = updateData.order_index;
    if (updateData.visit_date !== undefined) updateFields.visit_date = updateData.visit_date;
    if (updateData.visit_time_slot !== undefined) updateFields.visit_time_slot = updateData.visit_time_slot;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

    await db.collection('plan_locations').doc(planLocationId).update(updateFields);

    const plResult = await db.collection('plan_locations').doc(planLocationId).get();
    if (plResult.data.length === 0) return null;
    const pl = plResult.data[0];

    const locResult = await db.collection('locations').doc(pl.location_id).get();
    const loc = locResult.data[0];

    return {
      id: pl._id,
      plan_id: pl.plan_id,
      location: {
        id: loc._id,
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        description: loc.description,
        order_index: loc.order_index,
        created_at: loc.created_at
      },
      order_index: pl.order_index,
      visit_date: pl.visit_date,
      visit_time_slot: pl.visit_time_slot,
      notes: pl.notes,
      created_at: pl.created_at,
      updated_at: pl.updated_at
    };
  } catch (e) {
    console.error('updatePlanLocation error:', e);
    throw e;
  }
}

async function deletePlanLocation(planLocationId) {
  try {
    const plResult = await db.collection('plan_locations').doc(planLocationId).get();
    if (plResult.data.length === 0) throw new Error('规划地点不存在');

    const pl = plResult.data[0];

    await db.collection('locations').doc(pl.location_id).remove();
    await db.collection('plan_locations').doc(planLocationId).remove();

    return { message: '删除成功' };
  } catch (e) {
    console.error('deletePlanLocation error:', e);
    throw e;
  }
}

async function reorderLocations(planId, locationIds) {
  try {
    const now = new Date().toISOString();

    for (let i = 0; i < locationIds.length; i++) {
      await db.collection('plan_locations').doc(locationIds[i]).update({
        order_index: i,
        updated_at: now
      });
    }

    return { message: '排序更新成功' };
  } catch (e) {
    console.error('reorderLocations error:', e);
    throw e;
  }
}

async function getPlanSummaryInfo(planId) {
  try {
    const plan = await getPlanById(planId);
    if (!plan) {
      return { success: false, error: '规划不存在' };
    }

    const locations = await getPlanLocations(planId);

    return {
      success: true,
      plan: {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        start_date: plan.start_date,
        end_date: plan.end_date,
        budget_min: plan.budget_min,
        budget_max: plan.budget_max,
        num_people: plan.num_people,
        preferences: plan.preferences,
        start_location: plan.start_location,
        destination: plan.destination
      },
      locations: locations.map(l => ({
        id: l.id,
        name: l.location.name,
        type: l.location.description || '',
        cost: 0,
        duration: 0,
        time_slot: l.visit_time_slot || '',
        address: l.location.address,
        latitude: l.location.latitude,
        longitude: l.location.longitude
      }))
    };
  } catch (e) {
    console.error('getPlanSummaryInfo error:', e);
    return { success: false, error: e.message };
  }
}

function parseQuery(path) {
  const segments = path.split('/').filter(Boolean);
  return segments;
}

function parsePlanId(path) {
  const match = path.match(/\/plans\/([^/]+)/);
  if (match) return match[1];
  const simpleMatch = path.match(/^\/?([^/]+)$/);
  if (simpleMatch) return simpleMatch[1];
  const locationsMatch = path.match(/^\/?([^/]+)\/locations/);
  if (locationsMatch) return locationsMatch[1];
  return null;
}

function parsePlanLocationId(path) {
  const match = path.match(/\/plan-locations\/([^/]+)/);
  if (match) return match[1];
  const simpleMatch = path.match(/^\/?plan-locations\/([^/]+)/);
  if (simpleMatch) return simpleMatch[1];
  return null;
}

exports.main = async (event, context) => {
  if (!collectionsInitialized) {
    await ensureCollections();
    collectionsInitialized = true;
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  let path = event.path || '';
  const method = event.httpMethod;

  console.log(`[travel_plan] ${method} ${path}`);

  const segments = path.split('/').filter(Boolean);
  const planId = parsePlanId(path);
  const planLocationId = parsePlanLocationId(path);

  if ((path === '/' || segments.length === 0)) {
    if (method === 'GET') {
      const plans = await getPlans();
      return successResponse(plans);
    } else if (method === 'POST') {
      try {
        console.log('Body:', event.body);
        let body = event.body;
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
        if (!body || typeof body !== 'object') {
          return errorResponse('请求体格式错误', 400);
        }
        if (body.budget_min > body.budget_max) {
          return errorResponse('最小预算不能大于最大预算', 400);
        }
        if (new Date(body.start_date) > new Date(body.end_date)) {
          return errorResponse('开始日期不能晚于结束日期', 400);
        }
        const result = await createPlan(body);
        return successResponse(result, 201);
      } catch (e) {
        console.error('Error in POST /:', e);
        return errorResponse('请求数据格式错误: ' + e.message, 400);
      }
    }
  }

  const planPathMatch = path.match(/^\/?plans\/?([^/]+)?$|^\/?([^/]+)$/);
  if (planPathMatch) {
    const pid = planPathMatch[1] || planPathMatch[2];
    if (!pid) {
      if (method === 'GET') {
        const plans = await getPlans();
        return successResponse(plans);
      } else if (method === 'POST') {
        try {
          const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
          if (body.budget_min > body.budget_max) {
            return errorResponse('最小预算不能大于最大预算', 400);
          }
          if (new Date(body.start_date) > new Date(body.end_date)) {
            return errorResponse('开始日期不能晚于结束日期', 400);
          }
          const result = await createPlan(body);
          return successResponse(result, 201);
        } catch (e) {
          console.error('Error parsing body:', e);
          return errorResponse('请求数据格式错误', 400);
        }
      }
    } else {
      if (method === 'GET') {
        const plan = await getPlanById(pid);
        if (!plan) return errorResponse('规划不存在', 404);
        return successResponse(plan);
      } else if (method === 'PUT') {
        try {
          const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
          if (body.budget_min !== undefined && body.budget_max !== undefined && body.budget_min > body.budget_max) {
            return errorResponse('最小预算不能大于最大预算', 400);
          }
          if (body.start_date !== undefined && body.end_date !== undefined && new Date(body.start_date) > new Date(body.end_date)) {
            return errorResponse('开始日期不能晚于结束日期', 400);
          }
          const result = await updatePlan(pid, body);
          return successResponse(result);
        } catch (e) {
          console.error('Error parsing body:', e);
          return errorResponse('请求数据格式错误', 400);
        }
      } else if (method === 'DELETE') {
        const result = await deletePlan(pid);
        return successResponse(result);
      }
    }
  }

  try {
    const hasLocations = segments.includes('locations');
    const hasSummary = segments.includes('summary');
    const hasReorder = segments.includes('reorder');
    const hasPlanLocations = segments.includes('plan-locations');

    if (planId && hasLocations && !hasSummary) {
      if (method === 'GET') {
        const locations = await getPlanLocations(planId);
        return successResponse(locations);
      } else if (method === 'POST') {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const result = await addLocationToPlan(planId, body);
        return successResponse(result, 201);
      } else if (method === 'PUT' && hasReorder) {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const result = await reorderLocations(planId, body.locationIds);
        return successResponse(result);
      }
    }

    if (planId && hasSummary) {
      if (method === 'GET') {
        const result = await getPlanSummaryInfo(planId);
        if (!result.success) {
          return errorResponse(result.error, 404);
        }
        return successResponse(result);
      } else if (method === 'POST') {
        return successResponse({
          message: 'AI总结已迁移至独立ai_summary云函数，请调用ai_summary云函数',
          plan_id: planId,
          redirect: '请使用POST请求调用ai_summary云函数'
        });
      }
    }

    if (hasPlanLocations && planLocationId) {
      if (method === 'PUT') {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const result = await updatePlanLocation(planLocationId, body);
        if (!result) {
          return errorResponse('规划地点不存在', 404);
        }
        return successResponse(result);
      } else if (method === 'DELETE') {
        const result = await deletePlanLocation(planLocationId);
        return successResponse(result);
      }
    }

    return errorResponse('未找到对应的接口', 404);
  } catch (e) {
    console.error('[travel_plan] Error:', e);
    return errorResponse(e.message || '服务器内部错误', 500);
  }
};