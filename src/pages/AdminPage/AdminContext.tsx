import React, { createContext, useContext, useState } from "react";

interface AdminContextProps {
    storeName: string;
    setStoreName: (name: string) => void;
    gross_sales: number;
    setGrossSales: (value: number) => void;
    returning_customer_rate: number;
    setReturningCustomerRate: (value: number) => void;
    orders_fulfilled: number;
    setOrdersFulfilled: (value: number) => void;
    orders: number;
    setOrders: (value: number) => void;
    total_sales_over_time: number;
    setTotalSalesOverTime: (value: number) => void;
    conversion_rate_over_time: number;
    setConversionRateOverTime: (value: number) => void;
    average_order_value_over_time: number;
    setAverageOrderValueOverTime: (value: number) => void;
    date: string;
    setDate: (date: string) => void;
}

export const AdminProvider = ({ children } : { children: React.ReactNode }) => {
    const [storeName, setStoreName] = useState<string>("");
    const [gross_sales, setGrossSales] = useState<number>(0);
    const [returning_customer_rate, setReturningCustomerRate] = useState<number>(0);
    const [orders_fulfilled, setOrdersFulfilled] = useState<number>(0);
    const [orders, setOrders] = useState<number>(0);
    const [total_sales_over_time, setTotalSalesOverTime] = useState<number>(0);
    const [conversion_rate_over_time, setConversionRateOverTime] = useState<number>(0);
    const [average_order_value_over_time, setAverageOrderValueOverTime] = useState<number>(0);
    const [date, setDate] = useState<string>("");
    
    return (
        <AdminContext.Provider value={{
        storeName,
        setStoreName,
        gross_sales,
        setGrossSales,
        returning_customer_rate,
        setReturningCustomerRate,
        orders_fulfilled,
        setOrdersFulfilled,
        orders,
        setOrders,
        total_sales_over_time,
        setTotalSalesOverTime,
        conversion_rate_over_time,
        setConversionRateOverTime,
        average_order_value_over_time,
        setAverageOrderValueOverTime,
        date,
        setDate
        }}>
        {children}
        </AdminContext.Provider>
    );
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}