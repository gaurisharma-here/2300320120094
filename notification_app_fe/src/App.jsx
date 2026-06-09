import { useState, useEffect } from "react";
import { Box, AppBar, Toolbar, Typography, Tabs, Tab, Chip, CircularProgress, TextField, MenuItem, Pagination, Container } from "@mui/material";
import { getAllNotifications, getTopNotifications } from "./api";

const TYPE_COLORS = { Placement: "success", Result: "warning", Event: "info" };

function NotificationCard({ item, index }) {
  return (
    <Box sx={{ p: 2, mb: 1.5, borderRadius: 2, bgcolor: "background.paper", boxShadow: 1, borderLeft: 4, borderColor: item.Type === "Placement" ? "success.main" : item.Type === "Result" ? "warning.main" : "info.main" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Chip label={item.Type} color={TYPE_COLORS[item.Type] || "default"} size="small" />
        {item.priorityScore && <Chip label={`Score: ${item.priorityScore.toFixed(1)}`} size="small" variant="outlined" />}
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.Message}</Typography>
      <Typography variant="caption" color="text.secondary">{item.Timestamp}</Typography>
    </Box>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [all, setAll] = useState([]);
  const [priority, setPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [topN, setTopN] = useState(10);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [a, p] = await Promise.all([getAllNotifications(), getTopNotifications(topN)]);
        setAll(a.data.notifications || []);
        setPriority(p.data.notifications || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [topN]);

  const filtered = all.filter(n => filter === "All" || n.Type === filter);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#1a237e" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Campus Notifications</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ mb: 2, bgcolor: "white", borderRadius: 1 }}>
          <Tab label={`All Notifications (${all.length})`} />
          <Tab label={`Priority Inbox (${priority.length})`} />
        </Tabs>
        {loading ? <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box> : (
          <Box>
            {tab === 0 && (
              <Box>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <TextField select label="Filter by Type" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} size="small" sx={{ minWidth: 160, bgcolor: "white" }}>
                    {["All", "Placement", "Result", "Event"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Box>
                {paginated.map((n, i) => <NotificationCard key={n.ID} item={n} index={i} />)}
                <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} sx={{ mt: 2 }} />
              </Box>
            )}
            {tab === 1 && (
              <Box>
                <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
                  <Typography variant="body2">Show top:</Typography>
                  <TextField select value={topN} onChange={e => setTopN(Number(e.target.value))} size="small" sx={{ minWidth: 80, bgcolor: "white" }}>
                    {[5, 10, 15, 20].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Box>
                {priority.map((n, i) => <NotificationCard key={n.ID} item={n} index={i} />)}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
