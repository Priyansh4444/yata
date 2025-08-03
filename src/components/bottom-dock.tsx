export default function BottomDock() {
}
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded hover:bg-gray-700">Home</button>
        <button className="p-2 rounded hover:bg-gray-700">Search</button>
        <button className="p-2 rounded hover:bg-gray-700">Settings</button>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded hover:bg-gray-700">Profile</button>
        <button className="p-2 rounded hover:bg-gray-700">Logout</button>
      </div>
    </div>
  );
}
