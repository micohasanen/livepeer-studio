import {
  Box,
  Heading,
  Badge,
  Flex,
  Grid,
  Link as A,
  Text,
  styled,
  Skeleton,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../../public/img/icons/upcoming.svg";
import { useEffect, useState } from "react";
import { useApi } from "hooks";
import { products } from "@livepeer.studio/api/src/config";

const StyledUpcomingIcon = styled(UpcomingIcon, {
  mr: "$2",
  color: "$gray",
});

const UsageCard = ({ title, usage, limit, loading = false }) => {
  return (
    <Box
      css={{
        px: "$5",
        py: "$4",
        boxShadow: "0 0 0 1px $colors$neutral6",
        borderRadius: "$1",
        backgroundColor: "$neutral2",
        color: "$hiContrast",
        mb: "$6",
        minHeight: 92,
      }}>
      {loading ? (
        <Box
          css={{
            display: "flex",
            fd: "column",
            gap: "$3",
          }}>
          <Skeleton variant="title" css={{ width: "50%" }} />
          <Skeleton variant="heading" css={{ width: "25%" }} />
        </Box>
      ) : (
        <>
          <Box css={{ mb: "$2", color: "$primary9" }}>{title}</Box>
          <Flex align="center" css={{ fontSize: "$6" }}>
            <Box css={{ fontWeight: 700 }}>{usage}</Box>
            {limit && <Box css={{ mx: "$1" }}>/</Box>}
            {limit && <Box>{limit}</Box>}
          </Flex>
        </>
      )}
    </Box>
  );
};

const UsageSummary = () => {
  const { user, getUsage, getSubscription, getInvoices, getUserProduct } =
    useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const prices = getUserProduct(user).usage;
  const transcodingPrice = prices[0].price;

  useEffect(() => {
    const doGetInvoices = async (stripeCustomerId) => {
      const [res, invoices] = await getInvoices(stripeCustomerId);
      if (res.status == 200) {
        setInvoices(invoices);
      }
    };

    const doGetUsage = async (fromTime, toTime, userId) => {
      const [res, usage] = await getUsage(fromTime, toTime, userId);
      if (res.status == 200) {
        setUsage(usage);
      }
    };
    const getSubscriptionAndUsage = async (subscriptionId) => {
      const [res, subscription] = await getSubscription(subscriptionId);
      if (res.status == 200) {
        setSubscription(subscription);
      }
      doGetUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        user.id
      );
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  return (
    <>
      <Flex
        justify="between"
        align="end"
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
          pb: "$4",
          mb: "$5",
          width: "100%",
        }}>
        <Heading size="2">
          <Flex>
            <Box
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: "0",
              }}>
              Usage
            </Box>
            <Badge
              size="1"
              variant="primary"
              css={{ letterSpacing: 0, mt: "7px" }}>
              {user?.stripeProductId
                ? products[user.stripeProductId].name
                : products["prod_0"].name}{" "}
              Plan
            </Badge>
          </Flex>
        </Heading>
        <Flex css={{ fontSize: "$3", color: "$primary9" }}>
          Current billing period (
          {subscription && (
            <Flex>
              {new Date(
                subscription.current_period_start * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              to{" "}
              {new Date(
                subscription.current_period_end * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
            </Flex>
          )}
          )
        </Flex>
      </Flex>
      <Grid gap="4" columns="3">
        <UsageCard
          title="Transcoding minutes"
          loading={!usage}
          usage={
            usage &&
            (usage.sourceSegmentsDuration / 60).toFixed(2).toLocaleString()
          }
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
      </Grid>
      <Flex
        justify="between"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast" }}>
        <Text variant="gray" css={{ display: "flex", ai: "center" }}>
          <StyledUpcomingIcon />
          Upcoming invoice:{" "}
          <Box css={{ ml: "$1", fontWeight: 600 }}>
            {usage &&
              `$${(
                (usage.sourceSegmentsDuration / 60) *
                transcodingPrice
              ).toFixed(2)}`}
          </Box>
        </Text>
        <Link href="/dashboard/billing" passHref>
          <A variant="primary" css={{ display: "flex", alignItems: "center" }}>
            View billing <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </>
  );
};

export default UsageSummary;
