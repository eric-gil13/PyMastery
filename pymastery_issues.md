# PyMastery Issues

1. **State / Progress Reset on Restart**: Closing the computer and opening it back up resets the app to NumPy Part 1 every time, regardless of where the user previously was (e.g. NumPy Part 7, Pandas Part 3, etc.).
2. **'Next Problem' Button Disabled at Section Boundaries**: When reaching the final problem of Part 7 in a library section (e.g., the last problem of NumPy Part 7), the 'Next Problem' button is disabled instead of navigating to the start of the next section (e.g., Pandas Part 1).
3. **Track Completion Counter Not Resetting on Category Switch**: In the tracks view, switching categories (e.g. from NumPy to Pandas) still displays the completed assignment count from the previous section (e.g., showing `15/14 completed` in Pandas after completing 15 assignments in NumPy).
4. **Lack of Global/Centralized Database for Auth**: Account credentials (username & password) are isolated locally per deployment instance rather than synced via a global database, requiring separate sign-ups on each device/host (e.g. localhost MacBook, localhost PC, deployed site).
5. **Navbar Text Formatting & Redundant Library Display**:
   - **Duplicate Part Prefix**: Navbar displays duplicated prefixes (e.g., showing `Part 4: Part 4: Groupby and Aggregations` instead of `Part 4: Groupby and Aggregations`).
   - **Unnecessary Library Name**: Displaying the library name in the navbar header is redundant; showing just the category is sufficient.
