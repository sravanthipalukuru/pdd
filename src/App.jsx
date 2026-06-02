import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import ChildPortal from './pages/ChildPortal';
import ParentPortal from './pages/ParentPortal';
import DentistPortal from './pages/DentistPortal';
import DrSmilesChat from './pages/DrSmilesChat';
import GamesLibrary from './pages/GamesLibrary';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Store from './pages/Store';
import ToolMatch from './games/ToolMatch/ToolMatch';
import SugarBugRunner from './games/SugarBugRunner/SugarBugRunner';
import MagicMirror from './games/MagicMirror/MagicMirror';
import ClinicExplorer from './games/ClinicExplorer/ClinicExplorer';
import ToothDefender from './games/ToothDefender/ToothDefender';
import BrushMaster from './games/BrushMaster/BrushMaster';
import FindCavity from './games/FindCavity/FindCavity';
import SmileBuilder from './games/SmileBuilder/SmileBuilder';
import VirtualPetTooth from './games/VirtualPetTooth/VirtualPetTooth';
import BravePatient from './games/BravePatient/BravePatient';
import FlossHero from './games/FlossHero/FlossHero';
import DentalAdventure from './games/DentalAdventure/DentalAdventure';
import AnxietyBattle from './games/AnxietyBattle/AnxietyBattle';
import DentistAssistant from './games/DentistAssistant/DentistAssistant';
import GraduationDay from './games/GraduationDay/GraduationDay';
import ShapeMatcher from './games/ShapeMatcher/ShapeMatcher';
import ToothpastePuzzle from './games/ToothpastePuzzle/ToothpastePuzzle';
import PlaqueBlaster from './games/PlaqueBlaster/PlaqueBlaster';
import LunchboxSorter from './games/LunchboxSorter/LunchboxSorter';
import ToothFairyDressUp from './games/ToothFairyDressUp/ToothFairyDressUp';
import { useStore } from './store/useStore';
import './index.css';

export default function App() {
  const fetchProgress = useStore(state => state.fetchProgress);
  const userId = useStore(state => state.userId);

  useEffect(() => {
    if (userId) {
      fetchProgress();
    }
  }, [userId, fetchProgress]);

  const ProtectedRoute = ({ children }) => {
    if (!userId) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"             element={userId ? <ChildPortal /> : <Landing />} />
        <Route path="/child"        element={<ProtectedRoute><ChildPortal /></ProtectedRoute>} />
        <Route path="/parent"       element={<ProtectedRoute><ParentPortal /></ProtectedRoute>} />
        <Route path="/dentist"      element={<ProtectedRoute><DentistPortal /></ProtectedRoute>} />
        <Route path="/dr-smiles"    element={<ProtectedRoute><DrSmilesChat /></ProtectedRoute>} />
        <Route path="/games"        element={<ProtectedRoute><GamesLibrary /></ProtectedRoute>} />
        <Route path="/login"        element={<Login />} />
        <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/store"        element={<ProtectedRoute><Store /></ProtectedRoute>} />
        <Route path="/game/virtual-pet" element={<ProtectedRoute><VirtualPetTooth /></ProtectedRoute>} />
        <Route path="/game/clinic-explorer" element={<ProtectedRoute><ClinicExplorer /></ProtectedRoute>} />
        <Route path="/game/tool-match" element={<ProtectedRoute><ToolMatch /></ProtectedRoute>} />
        <Route path="/game/brave-patient" element={<ProtectedRoute><BravePatient /></ProtectedRoute>} />
        <Route path="/game/tooth-defender" element={<ProtectedRoute><ToothDefender /></ProtectedRoute>} />
        <Route path="/game/brush-master" element={<ProtectedRoute><BrushMaster /></ProtectedRoute>} />
        <Route path="/game/floss-hero" element={<ProtectedRoute><FlossHero /></ProtectedRoute>} />
        <Route path="/game/dental-adventure" element={<ProtectedRoute><DentalAdventure /></ProtectedRoute>} />
        <Route path="/game/find-cavity" element={<ProtectedRoute><FindCavity /></ProtectedRoute>} />
        <Route path="/game/anxiety-battle" element={<ProtectedRoute><AnxietyBattle /></ProtectedRoute>} />
        <Route path="/game/smile-builder" element={<ProtectedRoute><SmileBuilder /></ProtectedRoute>} />
        <Route path="/game/sugar-bug-runner" element={<ProtectedRoute><SugarBugRunner /></ProtectedRoute>} />
        <Route path="/game/dentist-assistant" element={<ProtectedRoute><DentistAssistant /></ProtectedRoute>} />
        <Route path="/game/magic-mirror" element={<ProtectedRoute><MagicMirror /></ProtectedRoute>} />
        <Route path="/game/shape-matcher" element={<ProtectedRoute><ShapeMatcher /></ProtectedRoute>} />
        <Route path="/game/toothpaste-puzzle" element={<ProtectedRoute><ToothpastePuzzle /></ProtectedRoute>} />
        <Route path="/game/plaque-blaster" element={<ProtectedRoute><PlaqueBlaster /></ProtectedRoute>} />
        <Route path="/game/lunchbox-sorter" element={<ProtectedRoute><LunchboxSorter /></ProtectedRoute>} />
        <Route path="/game/tooth-fairy" element={<ProtectedRoute><ToothFairyDressUp /></ProtectedRoute>} />
        <Route path="/game/graduation-day" element={<ProtectedRoute><GraduationDay /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
