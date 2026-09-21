function formatCurrency(amount, currency = "NGN") {
  const symbols = { NGN: "₦", USD: "$", GBP: "£", GHS: "₵" };
  const symbol = symbols[currency] || "₦";
  return `${symbol}${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = { formatCurrency, timeAgo };