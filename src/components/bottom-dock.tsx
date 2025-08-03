export default function BottomDock() {
  return (
    <div class="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div class="flex items-center space-x-4">
        <button class="p-2 rounded hover:bg-gray-700">Home</button>
        <button class="p-2 rounded hover:bg-gray-700">Search</button>
        <button class="p-2 rounded hover:bg-gray-700">Settings</button>
      </div>
      <div class="flex items-center space-x-4">
        <button class="p-2 rounded hover:bg-gray-700">Profile</button>
        <button class="p-2 rounded hover:bg-gray-700">Logout</button>
      </div>
    </div>
  );
}
