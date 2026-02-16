import React, { useState, useEffect } from 'react';
import api from './axios';

export const getAssociates = async (params) => {
    const response = await api.get('/associates', { params });
    return response.data;
};

export const createAssociate = async (associateData) => {
    const response = await api.post('/associates', associateData);
    return response.data;
};

export const updateAssociate = async (associateId, associateData) => {
    const response = await api.patch(`/associates/${associateId}`, associateData);
    return response.data;
};

export const deleteAssociate = async (associateId) => {
    const response = await api.delete(`/associates/${associateId}`);
    return response.data;
};
