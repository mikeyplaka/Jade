/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */

import Dashboard from './pages/Dashboard';
import MyWork from './pages/MyWork';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';
import MapView from './pages/MapView';
import TimeTracking from './pages/TimeTracking';
import Notifications from './pages/Notifications';
import EmployeeTracking from './pages/EmployeeTracking';
import GroupChat from './pages/GroupChat';
import Equipment from './pages/Equipment';
import Permissions from './pages/Permissions';
import Login from './pages/Login';

export const PAGES = {
  "Dashboard": Dashboard,
  "MyWork": MyWork,
  "Projects": Projects,
  "ProjectDetail": ProjectDetail,
  "Tasks": Tasks,
  "Employees": Employees,
  "Schedule": Schedule,
  "MapView": MapView,
  "TimeTracking": TimeTracking,
  "Notifications": Notifications,
  "EmployeeTracking": EmployeeTracking,
  "GroupChat": GroupChat,
  "Equipment": Equipment,
  "Permissions": Permissions,
  "Login": Login,
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
};

