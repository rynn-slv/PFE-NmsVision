import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Login from './Access/Login';
import Home from './Home';
import Signup from './Access/Signup';
import Guide from './Pages/Guide';
import Devices from './Pages/Devices';
import Connectivity from './Pages/connectivity';
import Tools from './Pages/Tools';
import NetworkMap from './Pages/NetworkMap';
import Equipment from './Pages/Equipment';
import AddEquipment from './Pages/AddEquipment';
import EditEquipment from './Pages/EditEquipment';
import Settings from './Pages/Settings';
import Dashboard from './Pages/Dashboard';
import ManageNetworks from './Pages/ManageNetworks';
import ManageOperators from './Pages/ManageOperators';
import Verifyemail from './Access/Verifyemail';
import Verifycode from './Access/Verifycode';
import Resetpass from './Access/Resetpass';
import NavigationGuard from './components/NavigationGuard';

function App() {
  return (
    <Router>
      <NavigationGuard>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgetpass" element={<Verifyemail />} />
          <Route path="/verify-code" element={<Verifycode />} />
          <Route path="/reset-password" element={<Resetpass />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/" element={<Home />} />
          <Route path="/guide" element={<Layout><Guide /></Layout>} />
          <Route path="/devices" element={<Layout><Devices /></Layout>} />
          <Route path="/connectivity" element={<Layout><Connectivity /></Layout>} />
          <Route path="/tools" element={<Layout><Tools /></Layout>} />
          <Route path="/map" element={<Layout><NetworkMap /></Layout>} />
          <Route path="/manage-devices" element={<Layout><Equipment /></Layout>} />
          <Route path="/add-device" element={<Layout><AddEquipment /></Layout>} />
          <Route path="/edit-device/:id" element={<Layout><EditEquipment /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/manage-networks" element={<Layout><ManageNetworks /></Layout>} />
          <Route path="/manage-operators" element={<Layout><ManageOperators /></Layout>} />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </NavigationGuard>
    </Router>

  );
}

export default App;
