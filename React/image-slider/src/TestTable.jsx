import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search } from 'lucide-react';

const rows = [
  { id: 1, lastName: 'Smith', firstName: 'John', age: 35 },
  { id: 2, lastName: 'Doe', firstName: 'Jane', age: 42 },
  { id: 3, lastName: 'Black', firstName: 'Sam', age: 28 },
  { id: 4, lastName: 'White', firstName: 'Anna', age: 22 },
  { id: 5, lastName: 'Johnson', firstName: 'Mike', age: 31 },
  { id: 6, lastName: 'Williams', firstName: 'Sarah', age: 27 },
  { id: 7, lastName: 'Brown', firstName: 'David', age: 39 },
  { id: 8, lastName: 'Davis', firstName: 'Lisa', age: 33 },
  { id: 9, lastName: 'Miller', firstName: 'Tom', age: 45 },
  { id: 10, lastName: 'Wilson', firstName: 'Kate', age: 29 },
  { id: 11, lastName: 'Moore', firstName: 'Alex', age: 37 },
  { id: 12, lastName: 'Taylor', firstName: 'Emma', age: 24 },
  { id: 13, lastName: 'Anderson', firstName: 'Chris', age: 41 },
  { id: 14, lastName: 'Thomas', firstName: 'Nina', age: 36 },
  { id: 15, lastName: 'Jackson', firstName: 'Ryan', age: 30 },
];

export default function TestTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter and sort data
  const filteredRows = rows.filter(row =>
    row.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.age.toString().includes(searchTerm)
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-6xl space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={headerVariants}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              User Table
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Manage and view user information</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          variants={itemVariants}
          className="relative max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </motion.div>

        {/* Table Container */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden shadow-2xl"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            {/* This div now handles scrolling for the entire table */}
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800 sticky top-0 z-10">
                  <tr>
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'firstName', label: 'First Name' },
                      { key: 'lastName', label: 'Last Name' },
                      { key: 'age', label: 'Age' }
                    ].map((column) => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors duration-200"
                      >
                        <div className="flex space-x-2"> {/* Centering content within th */}
                          <span>{column.label}</span>
                          {sortBy === column.key && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-blue-400"
                            >
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </motion.span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-800/20 divide-y divide-slate-700">
                  {sortedRows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-700/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold"
                        >
                          {row.id}
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium text-left">
                        {row.firstName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium text-lef"> {/* Centered Last Name */}
                        {row.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-left"> {/* Centered Age */}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                          {row.age} years
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden max-h-96 overflow-y-auto">
            <div className="space-y-4 p-4">
              {sortedRows.map((row, index) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold"
                    >
                      {row.id}
                    </motion.div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                      {row.age} years
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-medium text-lg">
                      {row.firstName} {row.lastName}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Results Counter */}
          <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700">
            <div className="text-sm text-slate-400 text-center">
              Showing {sortedRows.length} results
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
